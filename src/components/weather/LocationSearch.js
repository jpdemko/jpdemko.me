/* global Microsoft */

import React, { useState, useRef, useEffect } from 'react'
import styled, { css } from 'styled-components/macro'

import { ReactComponent as LocationSVG } from '../../shared/assets/material-icons/location.svg'
import Button from '../ui/Button'

/* --------------------------------- STYLES --------------------------------- */

const animDuration = 0.15

const Root = styled.div`
	flex: 0 0;
	display: flex;
	position: relative;
	&& {
		border-bottom: none;
	}
	${({ theme }) => css`
		box-shadow: inset 0 -1px 0 0 ${theme.mainColor};
		/* Fixing Bing elements; search results and children */
		& .MicrosoftMap .as_container_search {
			position: absolute;
			width: 100%;
			top: 100%;
			left: 0;
			background-color: ${theme.mainColor};
		}
		& .MicrosoftMap .as_container_search .asOuterContainer {
			border: none;
			box-shadow: none;
		}
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
	/* Fixing Bing elements; location search input */
	&[style] {
		background-color: #0000 !important;
	}
`

/* -------------------------------- COMPONENT ------------------------------- */

const LocationSearch = ({ map, onLocationFound }) => {
	const [input, setInput] = useState('')
	const suggestManagerRef = useRef()
	const searchManagerRef = useRef()

	const onLocationFoundRef = useRef()
	useEffect(() => {
		onLocationFoundRef.current = onLocationFound
	}, [onLocationFound])

	useEffect(() => {
		if (map) {
			Microsoft.Maps.loadModule(['Microsoft.Maps.AutoSuggest', 'Microsoft.Maps.Search'], {
				callback: () => {
					suggestManagerRef.current = new Microsoft.Maps.AutosuggestManager({
						maxResults: 5,
						map,
					})
					suggestManagerRef.current.attachAutosuggest('#searchInput', '#searchRoot', (mapData) =>
						onLocationFoundRef.current(mapData),
					)
					searchManagerRef.current = new Microsoft.Maps.Search.SearchManager(map)
				},
				errorCallback: console.log,
			})
		}
	}, [map])

	const onGeolocateCurrentPosition = () => {
		navigator.geolocation.getCurrentPosition(
			({ coords }) => {
				const location = new Microsoft.Maps.Location(coords.latitude, coords.longitude)
				searchManagerRef.current.reverseGeocode({
					location,
					callback: onLocationFoundRef.current,
				})
				setInput('')
			},
			console.log,
			{ enableHighAccuracy: true },
		)
	}

	return (
		<Root id='searchRoot'>
			<AutocompleteInput
				id='searchInput'
				placeholder='Add locations...'
				value={input}
				onClick={() => setInput('')}
				onChange={(e) => setInput(e.target.value)}
				style={{ backgroundColor: '#0000' }}
			/>
			<Button svg={LocationSVG} onClick={onGeolocateCurrentPosition} />
		</Root>
	)
}

export default LocationSearch
