import * as React from "react"
import styled, { css } from "styled-components/macro"

import { useOnClickOutside } from "../../shared/hooks"
import Backdrop from "../ui/Backdrop"

/* --------------------------------- STYLES --------------------------------- */

const Center = styled.div`
	position: absolute;
	width: 100%;
	height: 100%;
	display: flex;
	justify-content: center;
	align-items: center;
`

const Root = styled.div`
	position: relative;
	${({ isShown, animDuration }) => css`
		transition: ${animDuration}s;
		z-index: ${isShown ? 250000 : -1};
		opacity: ${isShown ? 1 : 0};
		transform: ${isShown ? "scale(1)" : "scale(0)"};
	`}
`

/* -------------------------------- COMPONENT ------------------------------- */

function Modal({ animDuration = 0.4, isShown = false, onClose, children, ...props }) {
	const modalRef = React.useRef()

	// 'useOnClickOutside()' will keep creating/removing event handlers on each render unless this is done.
	const memoizedCloseModal = React.useCallback(() => isShown && onClose(), [isShown, onClose])
	useOnClickOutside(modalRef, memoizedCloseModal)

	return (
		<>
			<Center>
				<Root {...props} ref={modalRef} animDuration={animDuration} isShown={isShown}>
					{children}
				</Root>
			</Center>
			<Backdrop animDuration={animDuration} isShown={isShown} />
		</>
	)
}

export default Modal
