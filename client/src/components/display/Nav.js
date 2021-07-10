import { useState } from "react"
import styled, { css } from "styled-components/macro"

import { ReactComponent as SvgMenu } from "../../shared/assets/material-icons/menu.svg"
import { ReactComponent as SvgApps } from "../../shared/assets/material-icons/apps.svg"
import { ReactComponent as SvgHome } from "../../shared/assets/material-icons/home.svg"
import { ReactComponent as SvgClose } from "../../shared/assets/material-icons/close.svg"
import Button from "../ui/Button"
import Drawer from "../ui/Drawer"
import { mountableApps } from "./Display"
import { opac } from "../../shared/shared"

/* --------------------------------- STYLES --------------------------------- */

const NavBtn = styled(Button)`
	${({ origTheme }) =>
		origTheme &&
		css`
			> svg {
				color: ${origTheme.highlight};
				fill: ${origTheme.highlight};
				filter: drop-shadow(1px 0px 0px ${opac(0.4, origTheme.darkestColor)})
					drop-shadow(0px -1px 0px ${opac(0.4, origTheme.darkestColor)})
					drop-shadow(0px 1px 0px ${opac(0.2, origTheme.lightestColor)})
					drop-shadow(-1px 0px 0px ${opac(0.2, origTheme.lightestColor)});
			}
		`}
`

/* -------------------------------------------------------------------------- */

const Taskbar = styled.div`
	height: var(--nav-height);
	display: flex;
	position: relative;
	z-index: 248000;
	opacity: 0.95;
	${({ theme }) => css`
		background: ${theme.background};
		border-top: 1px solid ${theme.accent};
	`}

	> * {
		margin: 0 1px;
	}
`

const TbarBtn = styled(NavBtn)`
	justify-content: flex-start;
`

const TbarBtnOpenedApp = styled(TbarBtn)`
	position: relative;
	${({ theme, isFocused }) => css`
		&::after {
			content: "";
			position: absolute;
			bottom: 0;
			left: ${isFocused ? 0 : "7%"};
			background: ${theme.highlight};
			height: ${isFocused ? 2 : 1}px;
			transition: all 0.175s;
			width: ${isFocused ? "100%" : "86%"};
		}
		@media (hover) {
			&:hover::after {
				left: 0;
				width: 100%;
				height: 2px;
			}
		}
		&:active::after {
			left: 0;
			width: 100%;
			height: 2px;
		}
	`}
`

const TbarBtnCloseApp = styled(Button)`
	position: absolute;
	font-size: 0.5em;
	right: 0;
	top: 0;
	transform: translate3d(50%, -50%, 0) scale(0.75);
	display: none;

	${TbarBtnOpenedApp}:hover & {
		display: inline-flex;
	}
`

/* -------------------------------------------------------------------------- */

const DrawerDescrip = styled.div`
	padding: var(--drawer-padding);
	font-weight: bold;
	${({ theme }) => css`
		background: ${theme.highlight};
		color: ${theme.highlightContrast};
	`}
`

const DrawerRow = styled.div`
	display: flex;
	${({ theme }) => css`
		border-top: 1px solid ${theme.backgroundAlt};
	`}
`

const DrawerBtn = styled(NavBtn)`
	justify-content: flex-start;
	flex: 1;
`
const DrawerCloseBtn = styled(NavBtn)`
	margin: 1px;
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
		const shared = mountableApps[app.title].shared
		return app.isClosed ? null : (
			<TbarBtnOpenedApp
				key={app.title}
				onClick={() => handleOpen(app.title)}
				svg={shared.logo}
				isFocused={app.isFocused}
				origTheme={shared.theme}
			>
				{shared.title}
				<TbarBtnCloseApp
					tag="div"
					onClick={(e) => {
						e.stopPropagation()
						handleClose(app.title)
					}}
					svg={SvgClose}
					variant="solid"
					setTheme="red"
				/>
			</TbarBtnOpenedApp>
		)
	})

	const drawerButtons = Object.keys(mountableApps).map((name) => {
		const mApp = mountableApps[name]
		const title = mApp.shared.title
		const app = apps[title]
		return (
			<DrawerRow key={title}>
				<DrawerBtn
					onClick={() => handleOpen(title)}
					svg={mApp.shared.logo}
					isFocused={app?.isFocused}
					origTheme={mApp.shared.theme}
				>
					{title}
				</DrawerBtn>
				{app && !app?.isClosed && (
					<DrawerCloseBtn
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
				<TbarBtn svg={SvgApps} onClick={() => setMainDrawerOpened(true)} />
				<TbarBtn svg={SvgHome} onClick={handleHomeButton} disabled={!oneAppNotMinimized} />
				{isMobileSite ? (
					<TbarBtn
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
