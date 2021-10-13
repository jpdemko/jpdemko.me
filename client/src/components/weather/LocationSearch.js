/* global Microsoft */

import { useState, useEffect, useRef } from "react"
import styled, { css } from "styled-components/macro"

import { useUpdatedValRef } from "../../shared/hooks"
import { ReactComponent as SvgLocation } from "../../shared/assets/material-icons/location.svg"
import { opac } from "../../shared/shared"
import Button from "../ui/Button"
import { Input } from "../ui/IO"

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div`
	flex: 0 0 auto;
	display: flex;
	position: relative;
	${({ theme }) => css`
		color: ${theme.backgroundContrast};
		/* Fixing Bing elements; search results and children... */
		.MicrosoftMap {
			--ls-length: 0.8em;
			a {
				color: ${theme.backgroundContrast} !important;
				@media (hover) {
					&:hover {
						background: ${opac(0.5, theme.highlight)};
						color: ${theme.highlightContrast};
					}
				}
				&:active,
				&::selection {
					background: ${opac(0.5, theme.highlight)};
					color: ${theme.highlightContrast};
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
				background-color: ${theme.backgroundAlt};
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
				color: ${theme.highlightContrast};
			}
		}
	`}
`

const LocSearchInput = styled(Input)`
	outline: none;
	flex: 1 1 auto;
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

	const mngsRef = useRef()
	const mngsLoadedRef = useRef(false)
	useEffect(() => {
		if (map && modulesLoaded && !mngsLoadedRef.current) {
			try {
				mngsRef.current = {
					autoSuggest: new Microsoft.Maps.AutosuggestManager({
						maxResults: 5,
						map,
					}),
					search: new Microsoft.Maps.Search.SearchManager(map),
				}
				// AutoSuggest callback when user clicks/activates current selection.
				mngsRef.current.autoSuggest.attachAutosuggest("#searchInput", "#searchRoot", (mapData) => {
					onLocationFoundRef.current(mapData)
				})
				if (mngsRef.current) mngsLoadedRef.current = true
			} catch (error) {
				mngsLoadedRef.current = false
				console.error("<LocationSearch /> map managers load error: ", error)
			}
		}

		return () => {
			if (mngsRef.current) mngsRef.current.autoSuggest.dispose()
		}
	}, [map, modulesLoaded, onLocationFoundRef])

	// Function for when user clicks on SvgLocation button to find their current location.
	function onGeolocateCurrentPosition() {
		if (!mngsLoadedRef.current || !navigator) return

		navigator.geolocation.getCurrentPosition(
			({ coords }) => {
				const location = new Microsoft.Maps.Location(coords.latitude, coords.longitude)
				mngsRef.current?.search.reverseGeocode({
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
				clearError={setError}
			/>
			<GeolocateBtn svg={SvgLocation} onClick={onGeolocateCurrentPosition} setColor="highlight" />
		</Root>
	)
}

export default LocationSearch
