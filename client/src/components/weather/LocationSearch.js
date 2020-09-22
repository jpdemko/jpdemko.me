/* global Microsoft */

import * as React from "react"
import styled, { css } from "styled-components/macro"

import { useUpdatedValRef } from "../../shared/hooks"
import { ReactComponent as LocationSVG } from "../../shared/assets/icons/location.svg"
import Button from "../ui/Button"

/* --------------------------------- STYLES --------------------------------- */

const animDuration = 0.15

const Root = styled.div`
	flex: 0 0 auto;
	display: flex;
	position: relative;
	${({ theme }) => css`
		border-bottom: 1px solid ${theme.contrast};
		box-shadow: inset 0 -1px 0 0 ${theme.altBackground};
		color: ${theme.contrast};
		/* Fixing Bing elements; search results and children */
		& .MicrosoftMap .as_container_search {
			position: absolute;
			width: 100%;
			top: 100%;
			left: 0;
			background-color: ${theme.altBackground};
			border-top: 1px solid ${theme.accent};
			border-bottom: 1px solid ${theme.accent};
			a {
				color: ${theme.contrast} !important;
			}
			a:hover {
				background: ${theme.background};
			}
		}
		& .MicrosoftMap .as_container_search .asOuterContainer {
			border: none;
			box-shadow: none;
			> div:first-child {
				display: none;
			}
		}
	`}
`

const AutocompleteInput = styled.input`
	border: none;
	outline: none;
	flex: 1 1 auto;
	transition: ${animDuration}s;
	/* Fixing Bing elements; location search input */
	&[style] {
		background-color: #0000 !important;
	}
	${({ theme }) => css`
		color: ${theme.contrast};
		&:not(:placeholder-shown),
		&:hover,
		&:active {
			box-shadow: inset 0 -2px 0 0 ${theme.contrast};
		}
	`}
`

/* -------------------------------- COMPONENT ------------------------------- */

let uniqueID = 0

function LocationSearch({ map, modulesLoaded, onLocationFound }) {
	const onLocationFoundRef = useUpdatedValRef(onLocationFound)
	const idRef = React.useRef(uniqueID++)
	const [input, setInput] = React.useState("")

	const mapManagersRef = React.useRef()
	const managersLoadedRef = React.useRef(false)
	React.useEffect(() => {
		if (map && modulesLoaded && !managersLoadedRef.current) {
			try {
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
					(mapData) => onLocationFoundRef.current(mapData)
				)
				managersLoadedRef.current = true
			} catch (error) {
				managersLoadedRef.current = false
				console.error(error)
			}
		}

		return () => {
			if (mapManagersRef.current) {
				mapManagersRef.current.autoSuggest.dispose()
			}
		}
	}, [map, modulesLoaded, onLocationFoundRef])

	function onGeolocateCurrentPosition() {
		if (!managersLoadedRef.current) return
		navigator.geolocation.getCurrentPosition(
			({ coords }) => {
				const location = new Microsoft.Maps.Location(coords.latitude, coords.longitude)
				mapManagersRef.current.search.reverseGeocode({
					location,
					callback: (mapData) => onLocationFoundRef.current(mapData),
				})
				setInput("")
			},
			({ code, message }) => {
				const output = `Geolocation error #${code}: ${message}`
				console.error(output)
				alert(output)
			},
			{ enableHighAccuracy: true }
		)
	}

	return (
		<Root id={`searchRoot${idRef.current}`}>
			<AutocompleteInput
				id={`searchInput${idRef.current}`}
				placeholder="Add locations..."
				value={input}
				onClick={() => setInput("")}
				onChange={(e) => setInput(e.target.value)}
			/>
			<Button svg={LocationSVG} onClick={onGeolocateCurrentPosition} />
		</Root>
	)
}

export default LocationSearch
