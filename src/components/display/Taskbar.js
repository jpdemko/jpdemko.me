import React from 'react'
import styled, { css, ThemeProvider, ThemeContext } from 'styled-components/macro'

import { ReactComponent as MenuSVG } from '../../shared/assets/material-icons/menu.svg'
import { ReactComponent as AppsSVG } from '../../shared/assets/material-icons/apps.svg'
import { ReactComponent as HomeSVG } from '../../shared/assets/material-icons/home.svg'
import { ReactComponent as CloseSVG } from '../../shared/assets/material-icons/close.svg'
import { themes } from '../../shared/shared'
import { ContextMenuTrigger, ContextMenu, MenuItem } from 'react-contextmenu'
import Button from '../ui/Button'
import Drawer from '../ui/Drawer'

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div`
	flex: 0 0 auto;
`

const NavButton = styled(Button)`
	font-size: 1.25em;
	${({ theme }) => css`
		color: ${theme.mainColor};
	`}
`

const BottomNav = styled.div`
	display: flex;
	flex: 0 0 auto;
	z-index: 4000;
	left: 0;
	bottom: 0;
	width: 100vw;
	opacity: 0.95;
	${({ theme }) => css`
		background: ${theme.mainColor};
	`}
`

const DrawerButtonsContainer = styled.div`
	display: flex;
	height: 100%;
	${({ isMobileSite }) => css`
		flex-direction: ${isMobileSite ? 'column-reverse' : 'column'};
	`}
`

/* -------------------------------- COMPONENT ------------------------------- */

const Taskbar = ({ openedApps, isMobileSite, handleHomeButton, closeApp, toggleFocusedAppNavDrawer }) => {
	const [mainDrawerOpened, setMainDrawerOpened] = React.useState(false)
	const curTheme = React.useContext(ThemeContext)

	const appShortcutClicked = React.useCallback((app) => {
		app.windowRef.current.toggleMinimize()
		setMainDrawerOpened(false)
	}, [])

	const handleClose = (id) => {
		setMainDrawerOpened(false)
		closeApp(id)
	}

	const navButtons = openedApps.map((app) => (
		<Root key={app.id}>
			<ContextMenuTrigger id={`nav-button-${app.id}`} holdToDisplay={-1}>
				<NavButton
					onClick={() => appShortcutClicked(app)}
					svg={app.class.shared.logo}
					isFocused={app.isFocused}
					theme={app.isFocused ? themes.blue : curTheme.contrastTheme}
				>
					{app.class.shared.title}
				</NavButton>
				{isMobileSite && (
					<Button onClick={() => handleClose(app.id)} svg={CloseSVG} variant='fancy' theme={themes.red} />
				)}
			</ContextMenuTrigger>
			<ContextMenu id={`nav-button-${app.id}`}>
				<MenuItem>
					<Button onClick={() => handleClose(app.id)} svg={CloseSVG} variant='fancy' theme={themes.red} />
				</MenuItem>
			</ContextMenu>
		</Root>
	))

	return (
		<>
			<BottomNav isMobileSite={isMobileSite}>
				<ThemeProvider theme={curTheme.contrastTheme}>
					<NavButton
						svg={HomeSVG}
						onClick={handleHomeButton}
						disabled={!openedApps.find((app) => app.isFocused) || openedApps.length < 1}
					/>
					{isMobileSite ? (
						<>
							<NavButton
								svg={AppsSVG}
								onClick={() => openedApps.length > 0 && setMainDrawerOpened(true)}
								disabled={openedApps.length < 1}
							/>
							<NavButton
								style={{ marginLeft: 'auto' }}
								svg={MenuSVG}
								onClick={toggleFocusedAppNavDrawer}
								disabled={!toggleFocusedAppNavDrawer}
							/>
						</>
					) : (
						navButtons
					)}
				</ThemeProvider>
			</BottomNav>
			{isMobileSite && (
				<Drawer animDuraton={0.25} isShown={mainDrawerOpened} onClose={() => setMainDrawerOpened(false)}>
					<ThemeProvider theme={curTheme.contrastTheme}>
						<DrawerButtonsContainer isMobileSite={isMobileSite}>{navButtons}</DrawerButtonsContainer>
					</ThemeProvider>
				</Drawer>
			)}
		</>
	)
}

export default Taskbar
