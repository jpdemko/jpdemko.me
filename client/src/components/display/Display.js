import { createRef, Component } from "react"
import styled, { css } from "styled-components/macro"
import { TransitionGroup } from "react-transition-group"
import throttle from "lodash/throttle"

import { getRect, ls } from "../../shared/shared"
import About from "../about/About"
import Weather from "../weather/Weather"
import Chat from "../chat/Chat"
import Themes from "../themes/Themes"
import Button from "../ui/Button"
import Window from "./Window"
import Nav from "./Nav"
import App from "./App"

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div`
	--nav-height: 2.25rem;
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
	font-size: 1.25em;
	font-weight: bold;
`

/* -------------------------------- COMPONENT ------------------------------- */

export const mountableApps = { About, Weather, Chat, Themes }

class Display extends Component {
	constructor(props) {
		super(props)
		const { apps = {}, zIndexLeader, grid } = ls.get("Display") ?? {}
		this.state = {
			apps,
			mainNavBurgerCB: null,
			grid: grid ?? {
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
		window.addEventListener("beforeunload", this.save)
		window.addEventListener("resize", this.setGridDimsThrottled)
	}

	componentWillUnmount() {
		window.removeEventListener("beforeunload", this.save)
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
		// const { mainNavBurgerCB, ...savableData } = this.state
		// ls.set("Display", {
		// 	...savableData,
		// 	zIndexLeader: this.zIndexLeader,
		// })
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
		if (!title) return console.log("genApp() skipped")

		console.log("genApp() ", title)
		const nextApps = { ...this.state.apps }
		const { isMobileSite } = this.props
		nextApps[title] = {
			title,
			isFocused: true,
			zIndex: ++this.zIndexLeader,
			isMinimized: false,
			isMaximized: isMobileSite,
			isClosed: false,
		}
		this.setState({ apps: nextApps })
	}

	openApp = (title) => {
		if (!title) return console.log("openApp() skipped")

		const { apps } = this.state
		const app = apps[title]
		console.log("openApp() ", title, app)
		if (app && !app?.isClosed) return this.toggleMinimize(title)
		else if (!app) this.genApp(title)
		else
			this.focusApp(title, {
				isClosed: false,
				isMinimized: false,
				...(this.props.isMobileSite && { isMaximized: true }),
			})
	}

	toggleMinimize = (title) => {
		const { apps } = this.state
		if (!apps[title]) return console.log("togMini() skipped")

		console.log("togMini()")
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
		if (!maxZ) return console.log(`getBelowApp(${title}) skipped`)

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
		const { apps } = this.state
		const app = apps[title]
		if (app?.isFocused && Object.keys(changes) < 1) return console.log(`focusApp(${title}) skipped`)

		const nextApps = { ...apps }
		let noMatches = true
		Object.keys(apps).forEach((t) => {
			const appFound = t === title
			if (appFound) {
				noMatches = false
				console.log(`focusApp(${t}) called`)
			}
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
									variant="fancy"
									svg={logo}
									column
									setTheme={theme.name}
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
									setMainNavBurgerCB={this.setMainNavBurgerCB}
								>
									<App
										isFocused={app.isFocused}
										tabHidden={this.props.tabHidden}
										title={app.title}
									/>
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
