import React, { useState, useCallback } from 'react'
import styled, { css, ThemeProvider } from 'styled-components/macro'

import { ReactComponent as AppsSVG } from '../../shared/assets/material-icons/apps.svg'
import { ReactComponent as HomeSVG } from '../../shared/assets/material-icons/home.svg'
import Button from '../ui/Button'
import Drawer from '../ui/Drawer'
import { themes } from '../../shared/variables'

/* ---------------------------- STYLED-COMPONENTS --------------------------- */

const NavButton = styled(Button)`
	flex: 0 0 auto;
	font-size: 1.25em;
`

const BottomNav = styled.div`
	display: flex;
	flex: 0;
	z-index: 4000;
	left: 0;
	bottom: 0;
	width: 100vw;
	background: rgba(0, 0, 0, 0.9);
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

/* -------------------------- NAVIGATION COMPONENT -------------------------- */

const Navigation = ({ openedApps, isMobile, toggleDesktop }) => {
	const [mobileDrawerOpened, setMobileDrawerOpened] = useState(false)

	const appShortcutClicked = useCallback((app) => {
		app.windowRef.current.toggleMinimize()
		setMobileDrawerOpened(false)
	}, [])

	return (
		<>
			<ThemeProvider theme={themes.light}>
				<BottomNav isMobile={isMobile}>
					<NavButton svg={HomeSVG} onClick={toggleDesktop} />
					{isMobile ? (
						<NavButton svg={AppsSVG} onClick={() => openedApps.length > 0 && setMobileDrawerOpened(true)} />
					) : (
						openedApps.map((app) => (
							<NavButton
								key={app.id}
								onClick={() => appShortcutClicked(app)}
								svg={app.class.shared.logo}
								isFocused={app.isFocused}
								{...(app.isFocused && { theme: themes.blue })}
							>
								{app.class.shared.title}#{app.id}
							</NavButton>
						))
					)}
				</BottomNav>
			</ThemeProvider>
			{isMobile && (
				<Drawer animDuraton={0.25} isShown={mobileDrawerOpened} onClose={() => setMobileDrawerOpened(false)}>
					<DrawerButtonsContainer isMobile={isMobile}>
						{openedApps.map((app) => (
							<NavButton
								key={app.id}
								onClick={() => appShortcutClicked(app)}
								svg={app.class.shared.logo}
								isFocused={app.isFocused}
								theme={app.isFocused ? themes.blue : themes.dark}
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
