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
		height: 100%;
		button {
			height: 100%;
		}
	}
`

const TaskbarBtn = styled(Button)`
	justify-content: flex-start;
`

const DrawerDescrip = styled.div`
	padding: var(--drawer-padding);
	${({ theme }) => css`
		background: ${theme.highlight};
		color: ${theme.contrast};
	`}
`

const DrawerRow = styled.div`
	display: flex;
	/* > button:nth-child(2) {
		margin: 1px;
	} */
`

const DrawerBtn = styled(Button)`
	padding: var(--drawer-padding);
	justify-content: flex-start;
	flex: 1;
`

const Taskbar = styled.div`
	height: var(--nav-height);
	display: flex;
	position: relative;
	z-index: 248000;
	opacity: 0.95;
	${({ theme }) => css`
		background: ${theme.background};
		border-top: 1px solid ${theme.accent};
		border-bottom: 1px solid ${theme.accent};
	`}
`

const DrawerBtnsCont = styled.div`
	--drawer-fsize: 1.25em;
	--drawer-padding: 0.5em 0.75em;
	font-size: var(--drawer-fsize);
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
				<TaskbarBtn
					onClick={() => handleOpen(app.title)}
					svg={mountableApps[app.title].shared.logo}
					isFocused={app.isFocused}
				>
					{mountableApps[app.title].shared.title}
				</TaskbarBtn>
			</ContextMenuTrigger>
			<ContextMenu id={`nav-tb-button-${app.title}`}>
				<MenuItem>
					<Button onClick={() => handleClose(app.title)} svg={CloseSVG} variant="fancy" color="red" />
				</MenuItem>
			</ContextMenu>
		</OpenedApp>
	))

	const drawerButtons = Object.keys(mountableApps).map((name) => {
		const mApp = mountableApps[name]
		const title = mApp.shared.title
		const oApp = openedApps.find((a) => a.title === title)
		return (
			<DrawerRow key={title}>
				<DrawerBtn onClick={() => handleOpen(title)} svg={mApp.shared.logo} isFocused={oApp?.isFocused}>
					{title}
				</DrawerBtn>
				{oApp && <Button onClick={() => handleClose(title)} svg={CloseSVG} color="red" />}
			</DrawerRow>
		)
	})

	return (
		<>
			<Taskbar isMobileSite={isMobileSite}>
				<TaskbarBtn svg={AppsSVG} onClick={() => setMainDrawerOpened(true)} />
				<TaskbarBtn
					svg={HomeSVG}
					onClick={handleHomeButton}
					disabled={!openedApps.find((app) => app.isFocused) || openedApps.length < 1}
				/>
				{isMobileSite ? (
					<TaskbarBtn
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
				<DrawerBtnsCont>
					<DrawerDescrip>APPS</DrawerDescrip>
					{drawerButtons}
				</DrawerBtnsCont>
			</Drawer>
		</>
	)
}

export default Nav
