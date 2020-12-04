/* global Microsoft */

import { useState, useEffect, useRef } from "react"
import styled, { css } from "styled-components/macro"

import { useUpdatedValRef } from "../../shared/hooks"
import { ReactComponent as LocationSVG } from "../../shared/assets/icons/location.svg"
import Button from "../ui/Button"
import { opac } from "../../shared/shared"
import { Input } from "../ui/IO"

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div`
	flex: 0 0 auto;
	display: flex;
	position: relative;
	background: inherit;
	${({ theme }) => css`
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
				top: 100%;
				left: 0;
				width: 100%;
				max-height: 80vh;
				overflow-x: hidden;
				overflow-y: auto;
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

const LocSearchInput = styled(Input)`
	outline: none;
	flex: 1 0 auto;
	margin: var(--wnav-padding);
	/* Fixing Bing elements; location search input... */
	> input[style] {
		background-color: inherit !important;
		width: -webkit-fill-available;
		width: stretch;
	}
`

const GeolocateBtn = styled(Button)`
	align-self: center;
	margin: var(--wnav-padding);
	margin-left: 0;
	flex: 0 0 auto;
`

/* -------------------------------- COMPONENT ------------------------------- */

function LocationSearch({ map, modulesLoaded, onLocationFound }) {
	const onLocationFoundRef = useUpdatedValRef(onLocationFound)
	const [input, setInput] = useState("")
	const [error, setError] = useState(null)

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
				// AutoSuggest callback when user clicks/activates current selection.
				mapManagersRef.current.autoSuggest.attachAutosuggest("#searchInput", "#searchRoot", (mapData) => {
					onLocationFoundRef.current(mapData)
					setInput("")
				})
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

	// Function for when user clicks on LocationSVG button to find their current location.
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
					callback: (mapData) => {
						onLocationFoundRef.current(mapData)
						setInput("")
					},
				})
			},
			({ code, message }) => {
				const output = `Geolocation error #${code}: ${message}`
				console.error(output)
				setError(output)
			},
			{ enableHighAccuracy: true }
		)
	}

	function handleChange(e) {
		setInput(e.target.value)
		if (error) setError(null)
	}

	return (
		<Root id="searchRoot">
			<LocSearchInput
				id="searchInput"
				label="Search"
				placeholder="Search cities/addresses/etc..."
				value={input}
				onChange={handleChange}
				error={error}
			/>
			<GeolocateBtn svg={LocationSVG} onClick={onGeolocateCurrentPosition} />
		</Root>
	)
}

export default LocationSearch
