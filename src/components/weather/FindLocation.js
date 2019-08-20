import React, { useState, useRef, useEffect } from 'react'
import styled, { css } from 'styled-components/macro'
import { TimelineLite } from 'gsap/all'
import PlacesAutocomplete, { geocodeByAddress, getLatLng } from 'react-places-autocomplete'

import { ReactComponent as svgLocation } from '../../shared/assets/material-icons/location.svg'
import { themes } from '../../shared/variables'
import Button from '../ui/Button'

/* ---------------------------- STYLED-COMPONENTS --------------------------- */

const FindLocationRoot = styled.div`
	display: flex;
	position: relative;
	${({ theme }) => css`
		box-shadow: 0 0 0 1px ${theme.mainColor};
	`}
`

const AutocompleteInput = styled.input`
	border: none;
	outline: none;
	flex: 1;
	${({ theme }) => css`
		color: ${theme.mainColor};
	`}
`

const AutocompleteResults = styled.div`
	position: absolute;
	display: flex;
	flex-direction: column;
	left: -1px;
	top: 100%;
	width: calc(100% + 2px);
	${({ theme, hasSuggestions }) => css`
		border: ${hasSuggestions ? `1px solid ${theme.mainColor}` : 'none'};
	`}
`

const Suggestion = styled(Button)`
	display: block;
`

/* ------------------------- FIND-LOCATION COMPONENT ------------------------ */

const FindLocation = ({ onLocationFound }) => {
	const [input, setInput] = useState('')
	const rootRef = useRef()
	const errorAnim = useRef()

	useEffect(() => {
		errorAnim.current = new TimelineLite({ paused: true })
		errorAnim.current.to(rootRef.current, 0.1, {
			boxShadow: `0 0 0 3px ${themes.red.mainColor}`,
			color: `${themes.red.mainColor}`,
			onComplete: () => errorAnim.current.reverse(),
		})
	}, [])

	const playErrorAnim = () => {
		if (!errorAnim.current.isActive()) errorAnim.current.play()
	}

	const onSelect = (address) => {
		geocodeByAddress(address)
			.then((results) => getLatLng(results[0]))
			.then((coords) => onLocationFound(coords))
			.catch(console.log)
		setInput('')
	}

	const onGeolocateCurrentPosition = () => {
		navigator.geolocation.getCurrentPosition(
			({ coords }) => {
				setInput('')
				onLocationFound({ lat: coords.latitude, lng: coords.longitude })
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
					<Button svg={svgLocation} onClick={onGeolocateCurrentPosition} />
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
