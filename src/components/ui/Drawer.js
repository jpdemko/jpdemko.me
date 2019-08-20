import React, { useCallback, useRef } from 'react'
import styled, { css } from 'styled-components/macro'

import { themes } from '../../shared/variables'
import { safeTranslate } from '../../shared/helpers'
import { useOnClickOutside } from '../../shared/customHooks'
import Backdrop from './Backdrop'

/* ---------------------------- STYLED-COMPONENTS --------------------------- */

const DrawerRoot = styled.div`
	position: absolute;
	z-index: 5001;
	top: 0;
	bottom: 0;
	min-width: 2em;
	${({ isShown, animDuration, side, theme }) => css`
		${side}: 0;
		background: ${themes.light.mainColor};
		transition: ${animDuration}s;
		transform: ${isShown ? safeTranslate('0, 0') : safeTranslate(`${side === 'left' ? '-' : ''}100%, 0`)};
		opacity: ${isShown ? 1 : 0};
	`}
`

/* ---------------------------- DRAWER COMPONENT ---------------------------- */

const Drawer = ({ isShown = false, onClose, animDuration = 0.5, side = 'left', children, ...props }) => {
	const drawerRef = useRef()

	// 'useOnClickOutside()' will keep creating/removing event handlers on each render unless this is done.
	const memoizedCloseDrawer = useCallback(() => onClose(), [onClose])
	useOnClickOutside(drawerRef, memoizedCloseDrawer)

	return (
		<>
			<Backdrop isShown={isShown} animDuration={animDuration} />
			<DrawerRoot ref={drawerRef} isShown={isShown} animDuration={animDuration} side={side} {...props}>
				{children}
			</DrawerRoot>
		</>
	)
}

export default Drawer
