import * as React from "react"
import styled, { css } from "styled-components/macro"
import { ContextMenuTrigger, ContextMenu, MenuItem } from "react-contextmenu"

import { ReactComponent as MenuSVG } from "../../shared/assets/icons/menu.svg"
import { ReactComponent as AppsSVG } from "../../shared/assets/icons/apps.svg"
import { ReactComponent as HomeSVG } from "../../shared/assets/icons/home.svg"
import { ReactComponent as CloseSVG } from "../../shared/assets/icons/close.svg"
import Button from "../ui/Button"
import Drawer from "../ui/Drawer"
import { mountableApps } from "./Display"

/* --------------------------------- STYLES --------------------------------- */

const OpenedApp = styled.div`
	.react-contextmenu-wrapper {
		display: flex;
		height: 100%;
		button {
			flex: 0 0 auto;
		}
		button:first-child {
			flex: 1 0 auto;
		}
	}
`

const TaskbarButton = styled(Button)`
	justify-content: flex-start;
	svg {
		flex: 0 0 auto;
	}
`

const DrawerRow = styled.div`
	display: flex;
`

const DrawerButton = styled(Button)`
	justify-content: flex-start;
	flex: 1;
	svg {
		flex: 0 0 auto;
	}
`

const Taskbar = styled.div`
	height: var(--nav-height);
	display: flex;
	position: relative;
	z-index: 4999;
	opacity: 0.95;
	${({ theme }) => css`
		background: ${theme.background};
		border-top: 1px solid ${theme.accent};
	`}
`

const DrawerButtonsContainer = styled.div`
	font-size: 1.25em;
	display: flex;
	height: 100%;
	flex-direction: column-reverse;
`

/* -------------------------------- COMPONENT ------------------------------- */

function Nav({ openedApps, isMobileSite, handleHomeButton, openApp, closeApp, mainNavBurgerCB }) {
	const [mainDrawerOpened, setMainDrawerOpened] = React.useState(false)

	function handleClose(title) {
		setMainDrawerOpened(false)
		closeApp(title)
	}

	function handleOpen(title) {
		setMainDrawerOpened(false)
		openApp(title)
	}

	const taskbarButtons = openedApps.map((app) => (
		<OpenedApp key={app.title}>
			<ContextMenuTrigger id={`nav-tb-button-${app.title}`} holdToDisplay={-1}>
				<TaskbarButton
					onClick={() => handleOpen(app.title)}
					svg={mountableApps[app.title].shared.logo}
					isFocused={app.isFocused}
				>
					{mountableApps[app.title].shared.title}
				</TaskbarButton>
			</ContextMenuTrigger>
			<ContextMenu id={`nav-tb-button-${app.title}`}>
				<MenuItem>
					<Button onClick={() => handleClose(app.title)} svg={CloseSVG} variant="fancy" color="red" />
				</MenuItem>
			</ContextMenu>
		</OpenedApp>
	))

	function genDrawerButtons(isTaskbar = false) {
		return Object.keys(mountableApps).map((name) => {
			const mApp = mountableApps[name]
			const title = mApp.shared.title
			const oApp = openedApps.find((a) => a.title === title)
			return (
				<DrawerRow key={title}>
					<DrawerButton
						onClick={() => handleOpen(title)}
						svg={mApp.shared.logo}
						isFocused={oApp?.isFocused}
					>
						{title}
					</DrawerButton>
					{oApp && !isTaskbar && (
						<Button onClick={() => handleClose(title)} svg={CloseSVG} variant="fancy" color="red" />
					)}
				</DrawerRow>
			)
		})
	}

	return (
		<>
			<Taskbar isMobileSite={isMobileSite}>
				<TaskbarButton svg={AppsSVG} onClick={() => setMainDrawerOpened(true)} />
				<TaskbarButton
					svg={HomeSVG}
					onClick={handleHomeButton}
					disabled={!openedApps.find((app) => app.isFocused) || openedApps.length < 1}
				/>
				{isMobileSite ? (
					<TaskbarButton
						style={{ marginLeft: "auto" }}
						svg={MenuSVG}
						onClick={mainNavBurgerCB}
						disabled={!mainNavBurgerCB}
					/>
				) : (
					taskbarButtons
				)}
			</Taskbar>
			<Drawer animDuraton={0.25} isShown={mainDrawerOpened} onClose={() => setMainDrawerOpened(false)}>
				<DrawerButtonsContainer>{genDrawerButtons()}</DrawerButtonsContainer>
			</Drawer>
		</>
	)
}

export default Nav
