import { useState } from "react"
import styled, { css } from "styled-components/macro"
import { ContextMenuTrigger, ContextMenu, MenuItem } from "react-contextmenu"

import { ReactComponent as SvgMenu } from "../../shared/assets/material-icons/menu.svg"
import { ReactComponent as SvgApps } from "../../shared/assets/material-icons/apps.svg"
import { ReactComponent as SvgHome } from "../../shared/assets/material-icons/home.svg"
import { ReactComponent as SvgClose } from "../../shared/assets/material-icons/close.svg"
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

const AppTaskbarBtn = styled(TaskbarBtn)`
	position: relative;
	${({ theme, isFocused }) => css`
		&::before {
			content: "";
			position: absolute;
			bottom: 0;
			left: ${isFocused ? 0 : "7%"};
			background: ${theme.highlight};
			height: ${isFocused ? 2 : 1}px;
			transition: all 0.175s;
			width: ${isFocused ? "100%" : "86%"};
		}
		&:hover::before {
			left: 0;
			width: 100%;
			height: 2px;
		}
	`}
`

const DrawerDescrip = styled.div`
	padding: var(--drawer-padding);
	font-weight: bold;
	${({ theme }) => css`
		background: ${theme.highlight};
		color: ${theme.primaryContrast};
	`}
`

const DrawerRow = styled.div`
	display: flex;
	${({ theme }) => css`
		border-top: 1px solid ${theme.altBackground};
	`}
`

const DrawerAppOpenBtn = styled(Button)`
	justify-content: flex-end;
	flex: 1;
`
const DrawerAppCloseBtn = styled(Button)`
	margin: 1px;
`

const Taskbar = styled.div`
	height: var(--nav-height);
	display: flex;
	position: relative;
	z-index: 248000;
	opacity: 0.95;
	> * {
		margin: 0 1px;
	}
	${({ theme }) => css`
		background: ${theme.background};
		border-top: 1px solid ${theme.accent};
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

function Nav({ apps, isMobileSite, handleHomeButton, openApp, closeApp, mainNavBurgerCB, ...props }) {
	const [mainDrawerOpened, setMainDrawerOpened] = useState(false)

	function handleClose(title) {
		setMainDrawerOpened(false)
		closeApp(title)
	}

	function handleOpen(title) {
		setMainDrawerOpened(false)
		openApp(title)
	}

	const taskbarButtons = Object.keys(apps).map((t) => {
		const app = apps[t]
		return app.isClosed ? null : (
			<OpenedApp key={app.title} isFocused={app.isFocused}>
				<ContextMenuTrigger id={`nav-tb-button-${app.title}`} holdToDisplay={-1}>
					<AppTaskbarBtn
						onClick={() => handleOpen(app.title)}
						svg={mountableApps[app.title].shared.logo}
						isFocused={app.isFocused}
					>
						{mountableApps[app.title].shared.title}
					</AppTaskbarBtn>
				</ContextMenuTrigger>
				<ContextMenu id={`nav-tb-button-${app.title}`}>
					<MenuItem>
						<Button
							onClick={() => handleClose(app.title)}
							svg={SvgClose}
							variant="fancy"
							setTheme="red"
							setColor="primary"
						/>
					</MenuItem>
				</ContextMenu>
			</OpenedApp>
		)
	})

	const drawerButtons = Object.keys(mountableApps).map((name) => {
		const mApp = mountableApps[name]
		const title = mApp.shared.title
		const app = apps[title]
		return (
			<DrawerRow key={title}>
				<DrawerAppOpenBtn
					onClick={() => handleOpen(title)}
					svg={mApp.shared.logo}
					isFocused={app?.isFocused}
				>
					{title}
				</DrawerAppOpenBtn>
				{app && !app?.isClosed && (
					<DrawerAppCloseBtn
						onClick={() => handleClose(title)}
						svg={SvgClose}
						setTheme="red"
						setColor="primary"
					/>
				)}
			</DrawerRow>
		)
	})

	const oneAppNotMinimized = !!Object.keys(apps).find((t) => !apps[t].isMinimized)
	return (
		<>
			<Taskbar {...props} isMobileSite={isMobileSite}>
				<TaskbarBtn svg={SvgApps} onClick={() => setMainDrawerOpened(true)} />
				<TaskbarBtn svg={SvgHome} onClick={handleHomeButton} disabled={!oneAppNotMinimized} />
				{isMobileSite ? (
					<TaskbarBtn
						style={{ marginLeft: "auto" }}
						svg={SvgMenu}
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
