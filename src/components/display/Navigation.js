import React from 'react'
import styled, { css, ThemeProvider } from 'styled-components/macro'

import { ReactComponent as MenuSVG } from '../../shared/assets/material-icons/menu.svg'
import { ReactComponent as AppsSVG } from '../../shared/assets/material-icons/apps.svg'
import { ReactComponent as HomeSVG } from '../../shared/assets/material-icons/home.svg'
import { themes } from '../../shared/shared'
import Button from '../ui/Button'
import Drawer from '../ui/Drawer'

/* --------------------------------- STYLES --------------------------------- */

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
`

const DrawerButtonsContainer = styled.div`
	display: flex;
	height: 100%;
	${({ isMobileSite }) => css`
		flex-direction: ${isMobileSite ? 'column-reverse' : 'column'};
	`}
`

/* -------------------------------- COMPONENT ------------------------------- */

const Navigation = ({ openedApps, isMobileSite, toggleDesktop, mobileMenuCallback }) => {
	const [mainDrawerOpened, setMainDrawerOpened] = React.useState(false)

	const appShortcutClicked = React.useCallback((app) => {
		app.windowRef.current.toggleMinimize()
		setMainDrawerOpened(false)
	}, [])

	return (
		<>
			<ThemeProvider theme={themes.light}>
				<BottomNav isMobileSite={isMobileSite}>
					<NavButton svg={HomeSVG} onClick={toggleDesktop} />
					{isMobileSite ? (
						<>
							<NavButton svg={AppsSVG} onClick={() => openedApps.length > 0 && setMainDrawerOpened(true)} />
							{mobileMenuCallback && (
								<NavButton
									style={{ marginLeft: 'auto' }}
									svg={MenuSVG}
									onClick={() => mobileMenuCallback()}
								/>
							)}
						</>
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
			{isMobileSite && (
				<Drawer animDuraton={0.25} isShown={mainDrawerOpened} onClose={() => setMainDrawerOpened(false)}>
					<DrawerButtonsContainer isMobileSite={isMobileSite}>
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
