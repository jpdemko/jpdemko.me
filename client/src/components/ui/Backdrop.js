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
		background: ${theme.darkestColor};
		transition: opacity ${animDuration}s;
	`};
`

const bdStyleStates = (zIndex, state) => {
	const styles = {
		entering: { opacity: 0.4, zIndex },
		entered: { opacity: 0.4, zIndex },
		exiting: { opacity: 0, zIndex },
		exited: { opacity: 0, zIndex: -1 },
	}
	return { ...styles[state] }
}

/* -------------------------------- COMPONENT ------------------------------- */

const Backdrop = forwardRef(
	({ isShown = false, animDuration = 0.4, interactFn, zIndex = 250000, ...props }, ref) => {
		return (
			<Transition timeout={animDuration * 1000} in={isShown} mountOnEnter unmountOnExit>
				{(state) => (
					<Root
						{...props}
						ref={ref}
						animDuration={animDuration}
						style={bdStyleStates(zIndex - 1, state)}
					/>
				)}
			</Transition>
		)
	}
)

export default Backdrop
