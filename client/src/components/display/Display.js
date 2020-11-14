import { createRef, Component } from "react"
import styled, { css } from "styled-components/macro"
import { TransitionGroup } from "react-transition-group"
import throttle from "lodash/throttle"

import { getRect, ls, Themes } from "../../shared/shared"
import About from "../about/About"
import Weather from "../weather/Weather"
import Chat from "../chat/Chat"
import Button from "../ui/Button"
import Window from "./Window"
import Nav from "./Nav"
import App from "./App"

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div`
	--nav-height: 2.25em;
	height: 100%;
	overflow: hidden;
`

const AllowedDragArea = styled.div`
	position: relative;
	height: calc(100% - var(--nav-height));
	overflow: hidden;
`

const DiagonalBG = styled.div`
	height: 100%;
	width: 100%;
	position: absolute;
	overflow: hidden;
	z-index: -1;
	${({ theme }) => css`
		background: ${theme.background};
		> div {
			height: 200%;
			width: 200%;
			background: ${theme.bgContrast};
			transform: translateY(20%) rotate(-10deg);
		}
	`}
`

// Not using CSS vars since used in JS computations and didn't export since only it's direct children use it.
const minWindowCSS = {
	width: 480,
	height: 320,
}

// Actual Window components use this wireframe's calculated px dimensions for their opening animation.
// Trying to animate the actual Windows when they have set % CSS applied doesn't give the desired resizing effect.
const WindowWireframe = styled.div`
	position: absolute;
	z-index: -5000;
	opacity: 0;
	${({ isMobileSite }) => css`
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		min-width: ${isMobileSite ? 120 : minWindowCSS.width}px;
		min-height: ${isMobileSite ? 80 : minWindowCSS.height}px;
		width: ${isMobileSite ? 100 : 65}%;
		height: ${isMobileSite ? 100 : 60}%;
	`}
`

const Shortcuts = styled.div`
	height: 100%;
	position: relative;
	z-index: 10; /* Need this because of absolute positioned background div. */
	--sc-padding: 0.75em;
	padding: var(--sc-padding);
	display: grid;
	${({ grid }) => css`
		grid-template-columns: repeat(${grid.cols}, 1fr);
		grid-template-rows: repeat(${grid.rows}, 1fr);
		grid-auto-flow: column;
		grid-gap: var(--sc-padding);
	`}
`

const ShortcutButton = styled(Button)`
	color: ${Themes.dark.bgContrast};
	font-size: 1.25em;
	font-weight: 500;
`

/* -------------------------------- COMPONENT ------------------------------- */

export const mountableApps = {}
const appClasses = [About, Weather, Chat]
appClasses.forEach((app) => (mountableApps[app.shared.title] = app))

const apps = {}

class Display extends Component {
	constructor(props) {
		super(props)
		const { appNames, zIndexLeader } = ls.get("Display") ?? {}
		const prevOpenedApps = (appNames ?? []).map(this.genApp)
		this.state = {
			openedApps: prevOpenedApps,
			mainNavBurgerCB: null,
			grid: {
				rows: 1,
				cols: 1,
			},
		}
		this.zIndexLeader = zIndexLeader ?? 999
		this.setGridDimsThrottled = throttle(this.setGridDims, 200)
		this.dragAreaRef = createRef()
	}

	componentDidMount() {
		this.setGridDims()
		window.addEventListener("resize", this.setGridDimsThrottled)
		window.addEventListener("beforeunload", this.save)
	}

	componentWillUnmount() {
		this.setGridDimsThrottled.cancel()
		window.removeEventListener("beforeunload", this.save)
		window.removeEventListener("resize", this.setGridDimsThrottled)
	}

	componentDidUpdate(prevProps, prevState) {
		const { isMobileSite } = this.props
		if (!prevProps.isMobileSite && isMobileSite) {
			const nextApps = Object.keys(apps).map((t) => {
				if (!apps[t].isMinimized && !apps[t].isMaximized) apps[t].isMaximized = true
				return apps[t]
			})
			this.setState({ openedApps: nextApps })
		}
	}

	saveApp = (title, extraData = {}) => {
		if (!title) return

		const prevData = ls.get(title) ?? {}
		ls.set(title, {
			title,
			...prevData,
			...apps[title],
			...extraData,
		})
	}

	save = () => {
		const appNames = Object.keys(apps)
		appNames.forEach(this.saveApp)
		ls.set("Display", {
			appNames,
			zIndexLeader: this.zIndexLeader,
		})
	}

	setGridDims = () => {
		const { width, height } = getRect(this.dragAreaRef.current)
		const optCell = 16 * 7 + 16 * 0.75 // 7em + (1em * .75)
		const nextGrid = {
			rows: Math.floor(height / optCell) ?? 1,
			cols: Math.floor(width / optCell) ?? 1,
		}
		const { grid } = this.state
		if (nextGrid.rows !== grid.rows || nextGrid.cols !== grid.cols) this.setState({ grid: nextGrid })
	}

	genApp = (title) => {
		if (!title) return

		const { isMobileSite } = this.props
		const prevData = ls.get(title) ?? {}
		const { window, ...desiredData } = prevData
		const newData = {
			title,
			isFocused: false,
			zIndex: ++this.zIndexLeader,
			isMinimized: false,
			isMaximized: isMobileSite, // End of defaults.
			...desiredData, // Loaded previous data.
			...(isMobileSite && { isMaximized: true }), // If site is mobile, overwrite all data.
		}
		apps[title] = newData
		return newData
	}

	openApp = (title) => {
		if (apps[title]) return this.toggleMinimize(title)

		this.genApp(title)
		this.focusApp(title, { isMinimized: false }, true)
	}

	toggleMinimize = (title) => {
		const app = apps[title]
		if (!app) return

		const { isMinimized, isMaximized, isFocused } = app
		if (!isMinimized && !isFocused) {
			this.focusApp(title)
		} else if (isFocused && !isMinimized) {
			app.isMinimized = true
			this.focusApp(this.getBelowApp(title))
		} else if (isMinimized) {
			this.focusApp(title, {
				isMinimized: false,
				isMaximized: isMinimized && isMaximized ? true : false,
			})
		}
	}
	toggleMaximize = (title) => {
		const app = apps[title]
		if (!app) return

		const { isMaximized } = app
		this.focusApp(title, {
			isMinimized: false,
			isMaximized: !isMaximized,
		})
	}

	closeApp = (title) => {
		if (!apps[title]) return

		apps[title].isMinimized = true
		this.saveApp(title)
		if (apps[title].isFocused) this.focusApp(this.getBelowApp(title))
		delete apps[title]
		this.setState({
			openedApps: Object.keys(apps).map((t) => apps[t]),
		})
	}

	handleHomeButton = () => {
		const nextApps = Object.keys(apps).map((t) => {
			apps[t].isMinimized = true
			apps[t].isFocused = false
			return apps[t]
		})
		this.setState({ openedApps: nextApps, mainNavBurgerCB: null })
	}

	getBelowApp = (title) => {
		const { zIndex } = apps[title]
		if (!zIndex) return

		let belowAppTitle = null
		if (zIndex && Object.keys(apps).length > 1) {
			Object.keys(apps).forEach((t) => {
				if (t === title || apps[t].isMinimized) return
				const curZ = apps[t].zIndex
				if (!belowAppTitle && curZ < zIndex) belowAppTitle = t
				else if (belowAppTitle && curZ < zIndex && curZ > apps[belowAppTitle].zIndex) belowAppTitle = t
			})
		}
		return belowAppTitle
	}

	focusApp = (title, changes = {}, force = false) => {
		const app = apps[title]
		if (!force && app?.isFocused && Object.keys(changes) < 1) return

		let noMatches = true
		const nextApps = Object.keys(apps).map((t) => {
			const appFound = t === title
			if (appFound) noMatches = false
			apps[t] = {
				...apps[t],
				...(appFound && {
					...changes,
					zIndex: ++this.zIndexLeader,
				}),
				isFocused: appFound,
			}
			return apps[t]
		})
		this.setState({ openedApps: nextApps, ...(noMatches && { mainNavBurgerCB: null }) })
	}

	setMainNavBurgerCB = (mainNavBurgerCB) => {
		this.setState({ mainNavBurgerCB })
	}

	render() {
		return (
			<Root>
				<DiagonalBG>
					<div />
				</DiagonalBG>
				<AllowedDragArea ref={this.dragAreaRef} id="allowedDragArea">
					<Shortcuts grid={this.state.grid}>
						{Object.keys(mountableApps).map((key) => {
							const { title, logo, theme } = mountableApps[key].shared
							return (
								<ShortcutButton
									key={title}
									onClick={() => this.openApp(title)}
									variant="fancy"
									svg={logo}
									column
									theme={theme}
								>
									{title}
								</ShortcutButton>
							)
						})}
					</Shortcuts>
					{this.props.children}
					<WindowWireframe id="window-wireframe" isMobileSite={this.props.isMobileSite} />
					<TransitionGroup component={null}>
						{this.state.openedApps.map((app, i) => (
							<Window
								key={app.title}
								isMobileSite={this.props.isMobileSite}
								isFocused={app.isFocused}
								title={app.title}
								minWindowCSS={minWindowCSS}
								closeApp={this.closeApp}
								focusApp={this.focusApp}
								zIndex={app.zIndex}
								isMinimized={app.isMinimized}
								isMaximized={app.isMaximized}
								toggleMaximize={this.toggleMaximize}
								toggleMinimize={this.toggleMinimize}
								setMainNavBurgerCB={this.setMainNavBurgerCB}
							>
								<App isFocused={app.isFocused} tabHidden={this.props.tabHidden} title={app.title} />
							</Window>
						))}
					</TransitionGroup>
				</AllowedDragArea>
				<Nav
					openedApps={this.state.openedApps}
					isMobileSite={this.props.isMobileSite}
					handleHomeButton={this.handleHomeButton}
					mainNavBurgerCB={this.state.mainNavBurgerCB}
					openApp={this.openApp}
					closeApp={this.closeApp}
				/>
			</Root>
		)
	}
}

export default Display
