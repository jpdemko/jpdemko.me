import React from "react"
import styled, { css } from "styled-components/macro"

import { addTheme, setupAppSharedOptions, Contexts } from "../../shared/shared"
import { ReactComponent as SmileSVG } from "../../shared/assets/icons/smile.svg"

/* --------------------------------- STYLES --------------------------------- */

/* -------------------------------- COMPONENT ------------------------------- */

function Themes({ ...props }) {
	const setCurTheme = React.useContext(Contexts.Themes)
}

export default Themes

/* * * SETTINGS * * *
	1. Themes
		- Select themes.
		- Create themes.
		- Save/load themes from local storage.
*/
