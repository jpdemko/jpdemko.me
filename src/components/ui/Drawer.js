import React from 'react'
import styled, { css } from 'styled-components/macro'

import { safeTranslate } from '../../shared/shared'
import { useOnClickOutside } from '../../shared/customHooks'
import Backdrop from './Backdrop'

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div`
	position: absolute;
	z-index: 5001;
	top: 0;
	bottom: 0;
	${({ isShown, animDuration, side, theme }) => css`
		${side}: 0;
		background-color: ${theme.mainColor};
		color: ${theme.bgContrastColor};
		transition: ${animDuration}s;
		transform: ${isShown ? safeTranslate('0, 0') : safeTranslate(`${side === 'left' ? '-' : ''}100%, 0`)};
		opacity: ${isShown ? 1 : 0};
	`}
`

/* -------------------------------- COMPONENT ------------------------------- */

const Drawer = ({ isShown = false, onClose, animDuration = 0.5, side = 'left', children, ...props }) => {
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
