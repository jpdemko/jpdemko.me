import React from 'react'
import styled, { css } from 'styled-components/macro'
import { Transition } from 'react-transition-group'

import { themes } from '../../shared/constants'

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div`
	position: absolute;
	z-index: 150000;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	background: ${themes.dark.mainColor};
	${({ isShown, animDuration }) => css`
		transition: ${animDuration}s;
		opacity: ${isShown ? 0.4 : 0};
	`};
`

/* -------------------------------- COMPONENT ------------------------------- */

function Backdrop({ isShown = false, animDuration = 0.5, ...props }) {
	return (
		<Transition timeout={animDuration * 1000} in={isShown} unmountOnExit>
			<Root isShown={isShown} animDuration={animDuration} {...props} />
		</Transition>
	)
}

export default Backdrop
