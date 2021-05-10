import { useCallback, useMemo, useRef } from "react"
import styled, { css } from "styled-components/macro"
import { Transition } from "react-transition-group"

import { useOnClick } from "../../shared/hooks"
import Backdrop from "../ui/Backdrop"
import { zOverlayGen } from "../../shared/shared"

/* --------------------------------- STYLES --------------------------------- */

const Center = styled.div`
	pointer-events: none;
	position: absolute;
	width: 100%;
	height: 100%;
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: -1;
`

const Root = styled.div`
	pointer-events: auto;
	transform: "scale(0)";
	opacity: 0;
	${({ animDuration, theme }) => css`
		transition-duration: ${animDuration}s;
		transition-property: transform, opacity;
		background: ${theme.background};
		border: 1px solid ${theme.accent};
	`}
`

const rootStyleStates = {
	entering: { transform: "scale(1.2)", opacity: 1 },
	entered: { transform: "scale(1)", opacity: 1 },
	exiting: { transform: "scale(0)", opacity: 0 },
	exited: { transform: "scale(0)", opacity: 0 },
}

const centeringStyleStates = (zIndex, state) => {
	const styles = {
		entering: { zIndex },
		entered: { zIndex },
		exiting: { zIndex },
		exited: { zIndex: -1 },
	}
	return { ...styles[state] }
}

/* -------------------------------- COMPONENT ------------------------------- */

function Modal({ animDuration = 0.25, isShown = false, onClose, children, ...props }) {
	const modalRef = useRef()

	const memoizedCloseModal = useCallback(() => isShown && onClose(), [isShown, onClose])
	const bdRef = useOnClick(memoizedCloseModal)

	const zIndex = useMemo(() => zOverlayGen.get(), [])

	return (
		<>
			<Backdrop ref={bdRef} isShown={isShown} zIndex={zIndex} />
			<Transition timeout={animDuration * 1000} in={isShown} mountOnEnter unmountOnExit>
				{(state) => (
					<Center style={centeringStyleStates(zIndex, state)}>
						<Root
							{...props}
							ref={modalRef}
							animDuration={animDuration}
							style={{ ...rootStyleStates[state] }}
						>
							{children}
						</Root>
					</Center>
				)}
			</Transition>
		</>
	)
}

export default Modal
