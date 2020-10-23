import { useContext } from "react"
import styled, { css } from "styled-components/macro"

import { addTheme, setupAppSharedOptions, Contexts } from "../../shared/shared"
import { ReactComponent as SmileSVG } from "../../shared/assets/icons/smile.svg"

/* --------------------------------- STYLES --------------------------------- */

/* -------------------------------- COMPONENT ------------------------------- */

function Themes({ ...props }) {
	const setCurTheme = useContext(Contexts.Themes)
}

export default Themes

/* * * SETTINGS * * *
	1. Themes
		- Select themes.
		- Create themes.
		- Save/load themes from local storage.
*/
