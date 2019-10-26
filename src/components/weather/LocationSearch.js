/* global Microsoft */

import React from 'react'
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

let uniqueID = 0

const LocationSearch = ({ map, modulesLoaded, onLocationFound }) => {
	const idRef = React.useRef(uniqueID++)
	const [input, setInput] = React.useState('')

	const mapManagersRef = React.useRef()
	const managersLoadedRef = React.useRef(false)
	React.useEffect(() => {
		if (map && modulesLoaded && !managersLoadedRef.current) {
			managersLoadedRef.current = true
			mapManagersRef.current = {
				autoSuggest: new Microsoft.Maps.AutosuggestManager({
					maxResults: 5,
					map,
				}),
				search: new Microsoft.Maps.Search.SearchManager(map),
			}
			const id = idRef.current
			mapManagersRef.current.autoSuggest.attachAutosuggest(
				`#searchInput${id}`,
				`#searchRoot${id}`,
				onLocationFoundRef.current,
			)
		}

		return () => {
			if (mapManagersRef.current) {
				mapManagersRef.current.autoSuggest.dispose()
			}
		}
	}, [map, modulesLoaded])

	const onLocationFoundRef = React.useRef()
	React.useEffect(() => {
		onLocationFoundRef.current = onLocationFound
	}, [onLocationFound])

	const onGeolocateCurrentPosition = () => {
		navigator.geolocation.getCurrentPosition(
			({ coords }) => {
				const location = new Microsoft.Maps.Location(coords.latitude, coords.longitude)
				mapManagersRef.current.search.reverseGeocode({
					location,
					callback: onLocationFoundRef.current,
				})
				setInput('')
			},
			(err) => console.log('<LocationSearch /> getCurrentPosition() error: ', err),
			{ enableHighAccuracy: true },
		)
	}

	return (
		<Root id={`searchRoot${idRef.current}`}>
			<AutocompleteInput
				id={`searchInput${idRef.current}`}
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
