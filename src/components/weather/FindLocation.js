import React, { useState, useRef, useEffect } from 'react'
import styled, { css } from 'styled-components/macro'
import { TimelineLite } from 'gsap/all'
import PlacesAutocomplete, { geocodeByAddress, getLatLng } from 'react-places-autocomplete'

import { ReactComponent as LocationSVG } from '../../shared/assets/material-icons/location.svg'
import { themes } from '../../shared/variables'
import Button from '../ui/Button'

/* ---------------------------- STYLED-COMPONENTS --------------------------- */

const animDuration = 0.15

const FindLocationRoot = styled.div`
	display: flex;
	position: relative;
	&& {
		border-bottom: none;
	}
	${({ theme }) => css`
		box-shadow: inset 0 -1px 0 0 ${theme.mainColor};
	`}
`

const AutocompleteInput = styled.input`
	border: none;
	outline: none;
	flex: 1;
	transition: ${animDuration}s;
	${({ theme }) => css`
		color: ${theme.mainColor};
		&:hover {
			box-shadow: inset 0 -2px 0 0 ${theme.mainColor};
		}
		&:active {
			box-shadow: inset 0 -2px 0 0 ${theme.mainColor};
		}
	`}
`

const AutocompleteResults = styled.div`
	position: absolute;
	display: flex;
	flex-direction: column;
	top: 100%;
	${({ theme }) => css`
		background-color: ${theme.bgContrastColor};
	`}
`

const Suggestion = styled(Button)`
	width: 100%;
	${({ theme }) => css`
		border-bottom: 1px solid ${theme.mainColor};
	`}
`

/* ------------------------- FIND-LOCATION COMPONENT ------------------------ */

const FindLocation = ({ onLocationFound }) => {
	const [input, setInput] = useState('')
	const rootRef = useRef()
	const errorAnim = useRef()

	useEffect(() => {
		errorAnim.current = new TimelineLite({ paused: true })
		errorAnim.current.to(rootRef.current, animDuration, {
			boxShadow: `inset 0 -3px 0 0 ${themes.red.mainColor}`,
			color: `${themes.red.mainColor}`,
			onComplete: () => errorAnim.current.reverse(),
		})
	}, [])

	const playErrorAnim = () => {
		if (!errorAnim.current.isActive()) errorAnim.current.play()
	}

	const handoffLocation = (lat, lng) => {
		const decPlace = 10000
		const roundLat = Math.round(lat * decPlace) / decPlace
		const roundLng = Math.round(lng * decPlace) / decPlace
		onLocationFound(roundLat, roundLng)
	}

	const onSelect = (address) => {
		geocodeByAddress(address)
			.then((results) => getLatLng(results[0]))
			.then(({ lat, lng }) => handoffLocation(lat, lng))
			.catch(console.log)
		setInput('')
	}

	const onGeolocateCurrentPosition = () => {
		navigator.geolocation.getCurrentPosition(
			({ coords }) => {
				setInput('')
				handoffLocation(coords.latitude, coords.longitude)
			},
			console.log,
			{ enableHighAccuracy: true },
		)
	}

	return (
		<PlacesAutocomplete
			value={input}
			onChange={setInput}
			onSelect={onSelect}
			shouldFetchSuggestions={input.length > 2}
			highlightFirstSuggestion
			searchOptions={{ types: ['geocode'] }}
			onError={playErrorAnim}
		>
			{({ getInputProps, suggestions, getSuggestionItemProps, loading }) => (
				<FindLocationRoot ref={rootRef}>
					<AutocompleteInput
						{...getInputProps({
							placeholder: 'Add locations...',
						})}
					/>
					<Button svg={LocationSVG} onClick={onGeolocateCurrentPosition} />
					<AutocompleteResults hasSuggestions={suggestions.length > 0}>
						{loading && <div>Loading...</div>}
						{suggestions.map((s) => (
							<Suggestion key={s.description} isFocused={s.active} {...getSuggestionItemProps(s)}>
								{s.description}
							</Suggestion>
						))}
					</AutocompleteResults>
				</FindLocationRoot>
			)}
		</PlacesAutocomplete>
	)
}

export default FindLocation
