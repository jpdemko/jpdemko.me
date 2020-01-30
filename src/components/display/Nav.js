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

const OpenedApp = styled.div`
	.react-contextmenu-wrapper {
		display: flex;
		button {
			flex: 0 0 auto;
		}
		button:first-child {
			flex: 1 0 auto;
		}
	}
`

const NavButton = styled(Button)`
	font-weight: 500;
	justify-content: flex-start;
	svg {
		flex: 0 0 auto;
	}
	${({ theme }) => css`
		color: ${theme.mainColor};
	`}
`

const Taskbar = styled.div`
	height: var(--nav-height);
	display: flex;
	position: relative;
	z-index: 4999;
	opacity: 0.95;
	${({ theme }) => css`
		background: ${theme.mainColor};
	`}
`

const DrawerButtonsContainer = styled.div`
	font-size: 1.25em;
	display: flex;
	height: 100%;
	flex-direction: column-reverse;
`

/* -------------------------------- COMPONENT ------------------------------- */

const Nav = ({
	mountableApps,
	openedApps,
	isMobileSite,
	handleHomeButton,
	openApp,
	closeApp,
	toggleFocusedAppNavDrawer,
}) => {
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

	const handleOpen = (app) => {
		setMainDrawerOpened(false)
		openApp(app)
	}

	const openedAppsButtons = openedApps.map((app) => (
		<OpenedApp key={app.id}>
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
		</OpenedApp>
	))

	return (
		<>
			<Taskbar isMobileSite={isMobileSite}>
				<ThemeProvider theme={curTheme.contrastTheme}>
					<NavButton
						svg={AppsSVG}
						onClick={() => setMainDrawerOpened(true)}
						disabled={isMobileSite && openedApps?.length < 1}
					/>
					<NavButton
						svg={HomeSVG}
						onClick={handleHomeButton}
						disabled={!openedApps.find((app) => app.isFocused) || openedApps.length < 1}
					/>
					{isMobileSite ? (
						<NavButton
							style={{ marginLeft: 'auto' }}
							svg={MenuSVG}
							onClick={toggleFocusedAppNavDrawer}
							disabled={!toggleFocusedAppNavDrawer}
						/>
					) : (
						openedAppsButtons
					)}
				</ThemeProvider>
			</Taskbar>
			<Drawer animDuraton={0.25} isShown={mainDrawerOpened} onClose={() => setMainDrawerOpened(false)}>
				<ThemeProvider theme={curTheme.contrastTheme}>
					<DrawerButtonsContainer>
						{isMobileSite
							? openedAppsButtons
							: mountableApps.map((app) => (
									<NavButton key={app.shared.title} svg={app.shared.logo} onClick={() => handleOpen(app)}>
										{app.shared.title}
									</NavButton>
							  ))}
					</DrawerButtonsContainer>
				</ThemeProvider>
			</Drawer>
		</>
	)
}

export default Nav
