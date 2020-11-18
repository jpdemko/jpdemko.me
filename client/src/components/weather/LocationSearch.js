/* global Microsoft */

import { useState, useEffect, useRef } from "react"
import styled, { css } from "styled-components/macro"

import { useUpdatedValRef } from "../../shared/hooks"
import { ReactComponent as LocationSVG } from "../../shared/assets/icons/location.svg"
import Button from "../ui/Button"
import { opac } from "../../shared/shared"

/* --------------------------------- STYLES --------------------------------- */

const animDuration = 0.15

const Root = styled.div`
	flex: 0 0 auto;
	display: flex;
	position: relative;
	${({ theme }) => css`
		border-bottom: 1px solid ${theme.bgContrast};
		box-shadow: inset 0 -1px 0 0 ${theme.altBackground};
		color: ${theme.bgContrast};
		/* Fixing Bing elements; search results and children... */
		.MicrosoftMap {
			--ls-length: 0.8em;
			a {
				color: ${theme.bgContrast} !important;
				&:hover,
				&:active,
				&::selection {
					background: ${opac(0.5, theme.highlight)};
					color: ${theme.primaryContrast};
				}
			}
			.as_container {
				.suggestLink {
					padding: calc(var(--ls-length) * 0.8) var(--ls-length);
				}
				.bingLogoLight {
					mix-blend-mode: luminosity;
				}
				.line1 {
					font-weight: bold;
				}
				.line2 {
					opacity: 0.85;
					transform: scale(0.9);
				}
			}
			.as_container_search {
				position: absolute;
				width: 100%;
				top: 100%;
				left: 0;
				background-color: ${theme.altBackground};
				border-top: 1px solid ${theme.accent};
				border-bottom: 1px solid ${theme.accent};
				.asOuterContainer {
					border: none;
					box-shadow: none;
					> div:first-child {
						display: none;
					}
				}
			}
			.as_lines_root {
				margin-left: var(--ls-length);
			}
			.suggestLink.selected {
				background: ${opac(0.75, theme.highlight)};
				color: ${theme.primaryContrast};
			}
		}
	`}
`

const AutocompleteInput = styled.input`
	border: none;
	outline: none;
	flex: 1 1 auto;
	transition: ${animDuration}s;
	/* Fixing Bing elements; location search input... */
	&[style] {
		background-color: #0000 !important;
	}
	${({ theme }) => css`
		color: ${theme.bgContrast};
		&:not(:placeholder-shown),
		&:hover,
		&:active {
			box-shadow: inset 0 -2px 0 0 ${theme.bgContrast};
		}
	`}
`

/* -------------------------------- COMPONENT ------------------------------- */

function LocationSearch({ map, modulesLoaded, onLocationFound }) {
	const onLocationFoundRef = useUpdatedValRef(onLocationFound)
	const [input, setInput] = useState("")

	const mapManagersRef = useRef()
	const managersLoadedRef = useRef(false)
	useEffect(() => {
		if (map && modulesLoaded && !managersLoadedRef.current) {
			try {
				mapManagersRef.current = {
					autoSuggest: new Microsoft.Maps.AutosuggestManager({
						maxResults: 5,
						map,
					}),
					search: new Microsoft.Maps.Search.SearchManager(map),
				}
				mapManagersRef.current.autoSuggest.attachAutosuggest("#searchInput", "#searchRoot", (mapData) =>
					onLocationFoundRef.current(mapData)
				)
				if (mapManagersRef.current) {
					// console.log("<LocationSearch /> map managers loaded", mapManagersRef.current)
					managersLoadedRef.current = true
				}
			} catch (error) {
				managersLoadedRef.current = false
				console.error("<LocationSearch /> map managers load error: ", error)
			}
		}

		return () => {
			if (mapManagersRef.current) {
				mapManagersRef.current.autoSuggest.dispose()
			}
		}
	}, [map, modulesLoaded, onLocationFoundRef])

	function onGeolocateCurrentPosition() {
		if (!managersLoadedRef.current || !navigator) {
			// console.log("<LocationSearch /> onGeolocateCurrentPosition() skipped, bad params")
			return
		}
		navigator.geolocation.getCurrentPosition(
			({ coords }) => {
				const location = new Microsoft.Maps.Location(coords.latitude, coords.longitude)
				mapManagersRef.current?.search.reverseGeocode({
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
		<Root id="searchRoot">
			<AutocompleteInput
				id="searchInput"
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
