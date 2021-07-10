import { createRef, Component } from "react"
import styled, { css } from "styled-components/macro"
import { TransitionGroup } from "react-transition-group"
import throttle from "lodash/throttle"

import { ls, Debug, opac } from "../../shared/shared"
import About from "../about/About"
import Weather from "../weather/Weather"
import Chat from "../chat/Chat"
import Themes from "../themes/Themes"
import Minesweeper from "../minesweeper/Minesweeper"
import Button from "../ui/Button"
import Window from "./Window"
import Nav from "./Nav"
import App from "./App"

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div`
	--nav-height: 2.35rem;
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
			background: ${theme.backgroundContrast};
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
		${!isMobileSite &&
		css`
			min-height: ${minWindowCSS.height};
			min-width: ${minWindowCSS.width};
		`}
		width: ${isMobileSite ? 100 : 60}%;
		height: ${isMobileSite ? 100 : 80}%;
	`}
`

const Shortcuts = styled.div`
	height: 100%;
	position: relative;
	z-index: 10; /* Need this because of absolute positioned background div. */
	--sc-padding: 1.25rem;
	padding: var(--sc-padding);
	display: grid;
	min-height: 0;
	min-width: 0;
	${({ grid }) => css`
		grid-template-columns: repeat(${grid.cols}, 1fr);
		grid-template-rows: repeat(${grid.rows}, 1fr);
		grid-auto-flow: column;
		grid-gap: var(--sc-padding);
	`}
`

const ShortcutButton = styled(Button)`
	font-size: 1.1rem;
	font-weight: bold;
	overflow: hidden;
	min-width: 0;
	> div {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	${({ theme }) => css`
		* {
			color: ${theme.lightestColor} !important;
		}
		svg {
			fill: ${theme.lightestColor} !important;
		}
	`}
`

/* -------------------------------- COMPONENT ------------------------------- */

// eslint-disable-next-line no-unused-vars
const debug = new Debug("Display: ", false)

export const mountableApps = { About, Chat, Weather, Themes }
if (process.env.NODE_ENV !== "production") mountableApps.Minesweeper = Minesweeper

class Display extends Component {
	constructor(props) {
		super(props)
		const { apps = {}, zIndexLeader, grid } = ls.get("Display") ?? {}
		this.state = {
			apps,
			mainNavBurgerCB: null,
			grid: grid ?? {
				rows: 2,
				cols: 2,
			},
		}
		this.zIndexLeader = zIndexLeader ?? 999
		this.setGridDimsThrottled = throttle(this.setGridDims, 200)
		this.dragAreaRef = createRef()
	}

	componentDidMount() {
		this.setGridDims()
		document.addEventListener("visibilitychange", this.save)
		window.addEventListener("resize", this.setGridDimsThrottled)
	}

	componentWillUnmount() {
		this.save()
		document.removeEventListener("visibilitychange", this.save)
		window.removeEventListener("resize", this.setGridDimsThrottled)
		this.setGridDimsThrottled.cancel()
	}

	componentDidUpdate(prevProps, prevState) {
		const { isMobileSite } = this.props
		if (!prevProps.isMobileSite && isMobileSite) {
			const nextApps = { ...this.state.apps }
			Object.keys(nextApps).forEach((t) => {
				const app = nextApps[t]
				if (!app.isMinimized && !app.isMaximized) app.isMaximized = true
			})
			this.setState({ apps: nextApps })
		}
	}

	save = () => {
		const { mainNavBurgerCB, ...savableData } = this.state
		ls.set("Display", {
			...savableData,
			zIndexLeader: this.zIndexLeader,
		})
	}

	setGridDims = () => {
		let nextGrid = {}
		const cellSize = 16 * 10
		nextGrid.rows = Math.round(window.innerHeight / cellSize)
		nextGrid.cols = Math.round(window.innerWidth / cellSize)
		this.setState({ grid: nextGrid })
	}

	genApp = (title) => {
		if (!title) return

		const nextApps = { ...this.state.apps }
		const { isMobileSite } = this.props
		nextApps[title] = {
			title,
			isFocused: false,
			zIndex: ++this.zIndexLeader,
			isMinimized: true,
			isMaximized: isMobileSite,
			isClosed: true,
		}
		this.setState({ apps: nextApps }, () => this.focusApp(title, { isClosed: false, isMinimized: false }))
	}

	openApp = (title) => {
		if (!title) return

		const { apps } = this.state
		const app = apps[title]
		if (app && !app?.isClosed) return this.toggleMinimize(title)
		else if (!app) {
			this.genApp(title)
		} else {
			this.focusApp(title, {
				isClosed: false,
				isMinimized: false,
				...(this.props.isMobileSite && { isMaximized: true }),
			})
		}
	}

	toggleMinimize = (title) => {
		const { apps } = this.state
		if (!apps[title]) return

		const nextApps = { ...apps }
		const app = nextApps[title]
		const { isMinimized, isMaximized, isFocused } = app
		if (!isMinimized && !isFocused) {
			this.focusApp(title)
		} else if (isFocused && !isMinimized) {
			app.isMinimized = true
			this.setState({ apps: nextApps }, () => this.focusApp(this.getBelowApp(title)))
		} else if (isMinimized) {
			this.focusApp(title, {
				isMinimized: false,
				isMaximized,
			})
		}
	}
	toggleMaximize = (title) => {
		const { apps } = this.state
		const app = apps[title]
		if (!app) return

		const { isMaximized } = app
		this.focusApp(title, {
			isMinimized: false,
			isMaximized: !isMaximized,
		})
	}

	closeApp = (title) => {
		if (!this.state.apps[title]) return

		const nextApps = { ...this.state.apps }
		const app = nextApps[title]
		app.isClosed = true
		app.isMinimized = true
		this.setState({ apps: nextApps }, () => {
			if (app.isFocused) this.focusApp(this.getBelowApp(title))
		})
	}

	handleHomeButton = () => {
		const nextApps = { ...this.state.apps }
		Object.keys(nextApps).forEach((t) => {
			nextApps[t].isMinimized = true
			nextApps[t].isFocused = false
		})
		this.setState({ apps: nextApps, mainNavBurgerCB: null })
	}

	getBelowApp = (title) => {
		const { apps } = this.state
		const { zIndex: maxZ } = apps[title]
		if (!maxZ) return

		let belowAppTitle = null
		if (maxZ && Object.keys(apps).length > 1) {
			Object.keys(apps).forEach((t) => {
				if (t === title || apps[t].isMinimized || apps[t].isClosed) return
				const curZ = apps[t].zIndex
				const firstPick = !belowAppTitle && curZ < maxZ
				const zIsBetween = belowAppTitle && curZ < maxZ && curZ > apps[belowAppTitle].zIndex
				if (firstPick || zIsBetween) belowAppTitle = t
			})
		}
		return belowAppTitle
	}

	focusApp = (title, changes = {}) => {
		const nextApps = { ...this.state.apps }
		const app = nextApps[title]
		if (app?.isFocused && Object.keys(changes) < 1) return

		let noMatches = true
		Object.keys(nextApps).forEach((t) => {
			const appFound = t === title
			if (appFound) noMatches = false
			nextApps[t] = {
				...nextApps[t],
				...(appFound && {
					...changes,
					zIndex: ++this.zIndexLeader,
				}),
				isFocused: appFound,
			}
		})
		this.setState({ apps: nextApps, ...(noMatches && { mainNavBurgerCB: null }) })
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
									svg={logo}
									column
									theme={theme}
									setTheme={theme.name}
									variant="combo"
								>
									{title}
								</ShortcutButton>
							)
						})}
					</Shortcuts>
					{this.props.children}
					<WindowWireframe id="window-wireframe" isMobileSite={this.props.isMobileSite} />
					<TransitionGroup component={null}>
						{Object.keys(this.state.apps).map((t) => {
							const app = this.state.apps[t]
							return app.isClosed ? null : (
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
									mainNavBurgerCB={this.state.mainNavBurgerCB}
									setMainNavBurgerCB={this.setMainNavBurgerCB}
								>
									<App title={app.title} />
								</Window>
							)
						})}
					</TransitionGroup>
				</AllowedDragArea>
				<Nav
					apps={this.state.apps}
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
