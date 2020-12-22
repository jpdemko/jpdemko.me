import { forwardRef } from "react"
import styled, { css } from "styled-components/macro"
import { Transition } from "react-transition-group"

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div`
	position: absolute;
	top: 0;
	left: 0;
	height: 100%;
	width: 100%;
	z-index: -1;
	opacity: 0;
	${({ animDuration, theme }) => css`
		background: ${theme.background};
		transition: ${animDuration}s;
	`};
`

const tgBackdropStyles = {
	entering: { opacity: 0.75, zIndex: 250000 },
	entered: { opacity: 0.75, zIndex: 250000 },
	exiting: { opacity: 0, zIndex: -1 },
	exited: { opacity: 0, zIndex: -1 },
}

/* -------------------------------- COMPONENT ------------------------------- */

const Backdrop = forwardRef(({ isShown = false, animDuration = 0.4, interactFn, ...props }, ref) => {
	return (
		<Transition timeout={animDuration * 1000} in={isShown}>
			{(state) => (
				<Root {...props} ref={ref} animDuration={animDuration} style={{ ...tgBackdropStyles[state] }} />
			)}
		</Transition>
	)
})

export default Backdrop
