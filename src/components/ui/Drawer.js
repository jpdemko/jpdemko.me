import React, { useCallback, useRef } from 'react'
import styled, { css } from 'styled-components/macro'

import { safeTranslate } from '../../shared/helpers'
import { useOnClickOutside } from '../../shared/customHooks'
import { sharedCSS } from '../../shared/variables'
import Backdrop from './Backdrop'

const DrawerRoot = styled.div`
	position: absolute;
	z-index: 5001;
	top: 0;
	bottom: 0;
	background: ${sharedCSS.themes.light.mainColor};
	min-width: 2em;
	${({ isShown, animDuration, side }) => css`
		${side}: 0;
		transition: ${animDuration}s;
		transform: ${isShown ? safeTranslate('0, 0') : safeTranslate(`${side === 'left' ? '-' : ''}100%, 0`)};
		opacity: ${isShown ? 1 : 0};
	`}
`

function Drawer({ isShown = false, onClose, animDuration = 0.5, side = 'left', children, ...props }) {
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
