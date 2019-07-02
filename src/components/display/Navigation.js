import React, { useState } from 'react'
import styled, { css } from 'styled-components/macro'
import { transparentize } from 'polished'

import Button from '../ui/Button'
import { sharedCSS } from '../../shared/variables'
import { ReactComponent as AppsSVG } from '../../shared/icons/material-icons/apps.svg'
import { ReactComponent as HomeSVG } from '../../shared/icons/material-icons/home.svg'

const NavRoot = styled.div`
	position: fixed;
	display: flex;
	bottom: 0;
	left: 0;
	z-index: 5000;
	transition: background 0.25s;
	${({ isMobile }) => css`
		width: ${isMobile ? 'auto' : '100%'};
		&:hover {
			background: ${transparentize('.85', sharedCSS.themes.mono.mainColor)};
		}
	`}
`

const NavButton = styled(Button)`
	font-size: 1.25em;
	flex-shrink: 0;
`

export default function Navigation({ openedApps, isMobile, toggleDesktop }) {
	const [mobileTrayOpened, setMobileTrayOpened] = useState(false)

	function handleClick(oApp) {
		oApp.windowRef.current.toggleMinimize()
		setMobileTrayOpened(false)
	}

	return (
		<NavRoot>
			<NavButton SVG={HomeSVG} onClick={toggleDesktop} />
			{isMobile && <NavButton SVG={AppsSVG} onClick={() => setMobileTrayOpened(true)} />}
			{(!isMobile || mobileTrayOpened) &&
				openedApps.map((oApp) => (
					<NavButton key={oApp.id} onClick={() => handleClick(oApp)} SVG={oApp.class.shared.logo}>
						{oApp.class.shared.title}#{oApp.id}
					</NavButton>
				))}
		</NavRoot>
	)
}
