import React from "react"
import styled, { css } from "styled-components/macro"

import { safeTranslate } from "../../shared/shared"
import { useOnClickOutside } from "../../shared/hooks"
import Backdrop from "./Backdrop"

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div`
	position: absolute;
	z-index: 150001;
	top: 0;
	bottom: 0;
	max-width: 85%;
	${({ isShown, animDuration, side, theme }) => css`
		left: ${side === "left" ? 0 : "none"};
		right: ${side === "left" ? "none" : 0};
		border-${side === "left" ? "right" : "left"}: 1px solid ${theme.accent};
		background-color: ${theme.background};
		color: ${theme.contrast};
		transition: ${animDuration}s;
		transform: ${isShown ? safeTranslate("0, 0") : safeTranslate(`${side === "left" ? "-" : ""}100%, 0`)};
		opacity: ${isShown ? 1 : 0};
	`}
`

/* -------------------------------- COMPONENT ------------------------------- */

function Drawer({ isShown = false, onClose, animDuration = 0.5, side = "left", children, ...props }) {
	const drawerRef = React.useRef()

	// 'useOnClickOutside()' will keep creating/removing event handlers on each render unless this is done.
	const memoizedCloseDrawer = React.useCallback(() => isShown && onClose(), [isShown, onClose])
	useOnClickOutside(drawerRef, memoizedCloseDrawer)

	return (
		<>
			<Root ref={drawerRef} isShown={isShown} animDuration={animDuration} side={side} {...props}>
				{children}
			</Root>
			<Backdrop isShown={isShown} animDuration={animDuration} />
		</>
	)
}

export default Drawer
