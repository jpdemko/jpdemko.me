import * as React from "react"
import styled, { css } from "styled-components/macro"
import { Transition } from "react-transition-group"

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
	z-index: -1;
`

const Root = styled.div`
	transform: "scale(0)";
	${({ animDuration }) => css`
		transition: ${animDuration}s;
	`}
`

const tgRootStyles = {
	entering: { opacity: 0.7, transform: "scale(1)" },
	entered: { opacity: 0.7, transform: "scale(1)" },
	exiting: { opacity: 0, transform: "scale(0)" },
	exited: { opacity: 0, transform: "scale(0)" },
}

const tgCenterStyles = {
	entering: { zIndex: 200000 },
	entered: { zIndex: 200000 },
	exiting: { zIndex: 200000 },
	exited: { zIndex: -1 },
}

/* -------------------------------- COMPONENT ------------------------------- */

function Modal({ animDuration = 0.4, isShown = false, onClose, children, ...props }) {
	const modalRef = React.useRef()

	// 'useOnClickOutside()' will keep creating/removing event handlers on each render unless this is done.
	const memoizedCloseModal = React.useCallback(() => isShown && onClose(), [isShown, onClose])
	useOnClickOutside(modalRef, memoizedCloseModal)

	return (
		<>
			<Transition timeout={animDuration * 1000} in={isShown}>
				{(state) => (
					<Center style={{ ...tgCenterStyles[state] }}>
						<Root
							{...props}
							ref={modalRef}
							animDuration={animDuration}
							style={{ ...tgRootStyles[state] }}
						>
							{children}
						</Root>
					</Center>
				)}
			</Transition>
			<Backdrop animDuration={animDuration} isShown={isShown} />
		</>
	)
}

export default Modal
