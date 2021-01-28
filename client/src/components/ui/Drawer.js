import { useCallback, useRef } from "react"
import styled, { css } from "styled-components/macro"
import { Transition } from "react-transition-group"

import { safeTranslate } from "../../shared/shared"
import { useOnClick } from "../../shared/hooks"
import Backdrop from "./Backdrop"

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div`
	position: absolute;
	z-index: 260000;
	top: 0;
	bottom: 0;
	max-width: 85%;
	height: 100%;
	> div {
		height: 100%;
		overflow-x: hidden;
		overflow-y: hidden;
	}
	${({ isShown, animDuration, side, theme }) => css`
		${side === "left" ? "left: 0;" : "right: 0;"}
		border-${side === "left" ? "right" : "left"}: 1px solid ${theme.accent};
		background-color: ${theme.background};
		color: ${theme.bgContrast};
		transition: transform ${animDuration}s ${isShown ? "ease-out" : "ease-in"};
		transform: ${isShown ? safeTranslate("0, 0") : safeTranslate(`${side === "left" ? "-" : ""}100%, 0`)};
	`}
`

const tranStyles = {
	entering: { visibility: "visible", contentVisibility: "visible" },
	exited: { visibility: "hidden", contentVisibility: "hidden" },
}

/* -------------------------------- COMPONENT ------------------------------- */

function Drawer({ isShown = false, onClose, animDuration = 0.25, side = "left", children, ...props }) {
	const drawerRef = useRef()

	const memoizedCloseDrawer = useCallback(() => isShown && onClose(), [isShown, onClose])
	const bdRef = useOnClick(memoizedCloseDrawer)

	return (
		<>
			<Transition timeout={animDuration * 1000} in={isShown}>
				{(state) => (
					<Root
						{...props}
						ref={drawerRef}
						isShown={isShown}
						animDuration={animDuration}
						side={side}
						style={{ ...tranStyles[state] }}
					>
						{children}
					</Root>
				)}
			</Transition>
			<Backdrop ref={bdRef} isShown={isShown} animDuration={animDuration} />
		</>
	)
}

export default Drawer
