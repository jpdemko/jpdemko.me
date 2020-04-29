import * as React from "react"
import styled, { css } from "styled-components/macro"

import { safeTranslate } from "../../shared/shared"
import { useOnClickOutside } from "../../shared/hooks"
import Backdrop from "./Backdrop"

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div`
	position: absolute;
	z-index: 175000;
	top: 0;
	bottom: 0;
	max-width: 90%;
	height: 100%;
	> div {
		height: 100%;
		overflow-x: hidden;
		overflow-y: auto;
	}
	${({ isShown, animDuration, side, theme }) => css`
		${side === "left" ? "left: 0;" : "right: 0;"}
		border-${side === "left" ? "right" : "left"}: 1px solid ${theme.accent};
		background-color: ${theme.background};
		color: ${theme.contrast};
		transition: transform ${animDuration}s ${isShown ? "ease-out" : "ease-in"};
		transform: ${isShown ? safeTranslate("0, 0") : safeTranslate(`${side === "left" ? "-" : ""}100%, 0`)};
	`}
`

/* -------------------------------- COMPONENT ------------------------------- */

function Drawer({ isShown = false, onClose, animDuration = 0.4, side = "left", children, ...props }) {
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
