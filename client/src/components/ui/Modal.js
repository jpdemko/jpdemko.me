import React from "react"
import styled, { css } from "styled-components/macro"

import { safeTranslate } from "../../shared/shared"
import { useOnClickOutside } from "../../shared/hooks"
import Backdrop from "../ui/Backdrop"

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div`
	position: absolute;
	top: 50%;
	left: 50%;
	${({ isShown, animDuration }) => css`
		transition: ${animDuration}s;
		z-index: ${isShown ? 250000 : -1};
		opacity: ${isShown ? 1 : 0};
		transform: ${safeTranslate("-50%, -50%")} ${isShown ? "scale(1)" : "scale(0)"};
	`}
`

/* -------------------------------- COMPONENT ------------------------------- */

function Modal({ animDuration = 0.5, isShown = false, onClose, children, ...props }) {
	const modalRef = React.useRef()

	// 'useOnClickOutside()' will keep creating/removing event handlers on each render unless this is done.
	const memoizedCloseModal = React.useCallback(() => isShown && onClose(), [isShown, onClose])
	useOnClickOutside(modalRef, memoizedCloseModal)

	return (
		<>
			<Root {...props} ref={modalRef} animDuration={animDuration} isShown={isShown}>
				{children}
			</Root>
			<Backdrop animDuration={animDuration} isShown={isShown} />
		</>
	)
}

export default Modal
