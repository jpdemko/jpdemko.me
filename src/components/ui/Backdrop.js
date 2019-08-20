import React from 'react'
import styled, { css } from 'styled-components/macro'
import { Transition } from 'react-transition-group'

/* ---------------------------- STYLED-COMPONENTS --------------------------- */

const BackdropRoot = styled.div`
	position: absolute;
	z-index: 5000;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	background: rgba(0, 0, 0, 0.5);
	${({ isShown, animDuration }) => css`
		transition: ${animDuration}s;
		opacity: ${isShown ? 1 : 0};
	`}
`

/* --------------------------- BACKDROP COMPONENT --------------------------- */

const Backdrop = ({ isShown = false, animDuration = 0.5, ...props }) => {
	return (
		<Transition timeout={animDuration * 1000} in={isShown} unmountOnExit>
			<BackdropRoot isShown={isShown} animDuration={animDuration} {...props} />
		</Transition>
	)
}

export default Backdrop
