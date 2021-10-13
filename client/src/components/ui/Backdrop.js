import { forwardRef } from "react"
import styled, { css } from "styled-components/macro"

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div`
	position: absolute;
	top: 0;
	left: 0;
	height: 100%;
	width: 100%;
	${({ animDuration, theme, isShown, zIndex }) => css`
		pointer-events: ${!isShown ? "none" : "auto"};
		z-index: ${zIndex};
		opacity: ${isShown ? 0.7 : 0};
		background: ${theme.darkestColor};
		transition: opacity ${animDuration}s;
	`};
`

/* -------------------------------- COMPONENT ------------------------------- */

const Backdrop = forwardRef(({ isShown = false, animDuration = 0.4, zIndex = 250000, ...props }, ref) => {
	return <Root {...props} ref={ref} animDuration={animDuration} isShown={isShown} zIndex={zIndex - 1} />
})

export default Backdrop
