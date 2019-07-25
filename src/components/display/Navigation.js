import React, { useState, useCallback } from 'react'
import styled, { css } from 'styled-components/macro'

import { ReactComponent as HomeSVG } from '../../shared/assets/material-icons/home.svg'
import { ReactComponent as AppsSVG } from '../../shared/assets/material-icons/apps.svg'
import Button from '../ui/Button'
import Drawer from '../ui/Drawer'

const NavButton = styled(Button)`
	flex: 0 0 auto;
	font-size: 1.25em;
`

const BottomNav = styled.div`
	display: flex;
	position: fixed;
	z-index: 4000;
	left: 0;
	bottom: 0;
	width: 100vw;
	background: rgba(0, 0, 0, 0.8);
	${({ isMobile }) => css`
		flex-direction: ${isMobile ? 'row-reverse' : 'row'};
	`}
`

const DrawerButtonsContainer = styled.div`
	display: flex;
	height: 100%;
	${({ isMobile }) => css`
		flex-direction: ${isMobile ? 'column-reverse' : 'column'};
	`}
`

function Navigation({ openedApps, isMobile, toggleDesktop }) {
	const [mobileDrawerOpened, setMobileDrawerOpened] = useState(false)

	const appShortcutClicked = useCallback((app) => {
		app.windowRef.current.toggleMinimize()
		setMobileDrawerOpened(false)
	}, [])

	return (
		<>
			<BottomNav isMobile={isMobile}>
				<NavButton SVG={HomeSVG} onClick={toggleDesktop} theme='light' />
				{isMobile ? (
					<NavButton
						SVG={AppsSVG}
						onClick={() => openedApps.length > 0 && setMobileDrawerOpened(true)}
						theme='light'
					/>
				) : (
					openedApps.map((app) => (
						<NavButton
							key={app.id}
							onClick={() => appShortcutClicked(app)}
							SVG={app.class.shared.logo}
							isFocused={app.isFocused}
							theme={app.isFocused ? 'blue' : 'light'}
						>
							{app.class.shared.title}#{app.id}
						</NavButton>
					))
				)}
			</BottomNav>
			{isMobile && (
				<Drawer
					animDuraton={0.25}
					isShown={mobileDrawerOpened}
					side='right'
					onClose={() => setMobileDrawerOpened(false)}
				>
					<DrawerButtonsContainer isMobile={isMobile}>
						{openedApps.map((app) => (
							<NavButton
								key={app.id}
								onClick={() => appShortcutClicked(app)}
								SVG={app.class.shared.logo}
								isFocused={app.isFocused}
								theme={app.isFocused ? 'blue' : 'dark'}
							>
								{app.class.shared.title}#{app.id}
							</NavButton>
						))}
					</DrawerButtonsContainer>
				</Drawer>
			)}
		</>
	)
}

export default Navigation