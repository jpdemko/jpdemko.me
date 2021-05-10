import { forwardRef, useCallback, useMemo } from "react"
import styled, { css } from "styled-components/macro"
import { Transition } from "react-transition-group"

import { safeTranslate, zOverlayGen } from "../../shared/shared"
import { useOnClick } from "../../shared/hooks"
import Backdrop from "./Backdrop"

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div`
	position: absolute;
	top: 0;
	bottom: 0;
	min-width: 20ch;
	max-width: 90%;
	height: 100%;
	overflow: hidden;
	> div {
		height: 100%;
		overflow: auto;
	}
	${({ isShown, animDuration, side, theme, zIndex }) => css`
		${side === "left" ? "left: 0;" : "right: 0;"}
		border-${side === "left" ? "right" : "left"}: 1px solid ${theme.accent};
		z-index: ${zIndex};
		background-color: ${theme.background};
		color: ${theme.backgroundContrast};
		transition: transform ${animDuration}s ${isShown ? "ease-out" : "ease-in"};
		transform: ${isShown ? safeTranslate("0, 0") : safeTranslate(`${side === "left" ? "-" : ""}100%, 0`)};
	`}
`

const drawerStyleStates = {
	entering: { visibility: "visible" },
	entered: { visibility: "visible" },
	exiting: { visibility: "visible" },
	exited: { visibility: "hidden" },
}

/* -------------------------------- COMPONENT ------------------------------- */

const Drawer = forwardRef(
	({ isShown = false, onClose, animDuration = 0.25, side = "left", children, ...props }, passedRef) => {
		const memoizedCloseDrawer = useCallback(() => isShown && onClose(), [isShown, onClose])
		const bdRef = useOnClick(memoizedCloseDrawer)

		const zIndex = useMemo(() => zOverlayGen.get(), [])

		return (
			<>
				<Backdrop ref={bdRef} isShown={isShown} animDuration={animDuration} zIndex={zIndex} />
				<Transition timeout={animDuration * 1000} in={isShown}>
					{(state) => (
						<Root
							{...props}
							ref={passedRef}
							isShown={isShown}
							animDuration={animDuration}
							side={side}
							zIndex={zIndex}
							style={{ ...drawerStyleStates[state] }}
						>
							{children}
						</Root>
					)}
				</Transition>
			</>
		)
	}
)

export default Drawer
