import React from 'react'
import styled, { css } from 'styled-components/macro'
import { TransitionGroup } from 'react-transition-group'

import TopographySVG from '../../shared/assets/backgrounds/topography.svg'
import { themes } from '../../shared/shared'
import Button from '../ui/Button'
import Window from './Window'
import Navigation from './Navigation'

/* ---------------------------- STYLED-COMPONENTS --------------------------- */

const DisplayRoot = styled.div`
	height: 100vh;
	display: flex;
	flex-direction: column;
	overflow: hidden;
`

const AllowedDragArea = styled.div`
	position: relative;
	flex: 1;
	padding: 1em;
`

const Background = styled.div`
	position: absolute;
	z-index: -1;
	top: 0;
	left: 0;
	height: 100vh;
	width: 100vw;
	opacity: 0.8;
	${({ theme }) => css`
		background-color: ${theme.mainColor};
	`}
`

// Only shared between Display/Window, doesn't really belong in 'variables.js' file, which is used everywhere.
const windowCSS = {
	minWidth: 480,
	minHeight: 320,
}

// Actual Window components use this wireframe's calculated px dimensions for their opening animation.
// Trying to animate the actual Windows when they have set % CSS applied doesn't give the desired resizing effect.
const WindowWireframe = styled.div`
	position: absolute;
	z-index: -5000;
	top: 50%;
	left: 50%;
	opacity: 0;
	transform: translate(-50%, -50%);
	min-width: ${windowCSS.minWidth}px;
	min-height: ${windowCSS.minHeight}px;
	width: 70%;
	height: 50%;
`

const Shortcuts = styled.div`
	position: relative;
	z-index: 10; /* Need this because of absolute positioned Background div */
	display: flex;
	flex-direction: column;
	align-items: flex-start;
`

const ShortcutButton = styled(Button)`
	font-size: 2em;
	margin: 0.5em;
`

/* ---------------------------- DISPLAY COMPONENT --------------------------- */

// GSAP's Draggable has a shared z-index updater across all instances, however it doesn't update
// in every circumstance we need it to.
let zIndexLeader = 999

// Each app gets a unique ID for their React key prop.
let uniqueID = 0

export default class Display extends React.Component {
	state = {
		openedApps: [],
	}
	recentlyMinimizedApps = []
	skipRestoreToggleDesktop = true

	componentDidUpdate(prevProps) {
		if (prevProps.isMobile !== this.props.isMobile) {
			this.state.openedApps.forEach((app) => {
				const wdow = app.windowRef.current
				if (this.props.isMobile) {
					app.desktopState = { ...wdow.state }
					if (app.isFocused && !wdow.state.isMinimized) wdow.maximize()
					else wdow.minimize(['skipFocusBelowApp', 'skipFocusApp'])
				} else if (app.desktopState) {
					const { isMaximized: wasMax, isWindowed: wasWindow } = app.desktopState
					if (wasMax) wdow.maximize(['skipFocusApp'])
					else if (wasWindow) wdow.restore(['skipFocusApp'])
				}
			})
		}
	}

	openApp = (app) => {
		const newApp = {
			id: ++uniqueID,
			windowRef: React.createRef(),
			class: app,
			isFocused: true,
			zIndex: ++zIndexLeader,
		}
		let nextOpenedApps = [...this.state.openedApps] // Copy currently opened apps array.
		nextOpenedApps.forEach((app) => (app.isFocused = false)) // New app is focused, old ones aren't.
		nextOpenedApps.push(newApp) // Add new app data to opened apps array copy.
		this.setState({ openedApps: nextOpenedApps })
		this.resetToggleDesktop()
	}

	closeApp = (curAppID) => {
		// Don't need to 'focusBelowApp' since 'minimize()' will call it from the Window component.
		this.setState((prevState) => ({
			openedApps: prevState.openedApps.filter((app) => app.id !== curAppID),
		}))
	}

	// Mimics Win10 desktop toggle or iOS/Android home button.
	toggleDesktop = () => {
		if (!this.props.isMobile && !this.skipRestoreToggleDesktop && this.recentlyMinimizedApps.length > 0) {
			this.recentlyMinimizedApps.forEach((app) => {
				const wdow = app.windowRef.current
				if (wdow.state.isMinimized) wdow.restore(['skipFocusApp'])
			})
			this.recentlyMinimizedApps = []
		} else {
			this.state.openedApps.forEach((app) => {
				if (!app.windowRef.current.state.isMinimized) {
					this.recentlyMinimizedApps.push(app)
					app.windowRef.current.minimize(['skipFocusBelowApp'])
				}
			})
			this.skipRestoreToggleDesktop = false
		}
	}

	// Only way I can think of to replicate the behaviour of the Win10 toggle desktop feature which delays
	// restoring apps because of closing/opening/animation/state changes.
	resetToggleDesktop = () => {
		this.skipRestoreToggleDesktop = true
	}

	focusBelowApp = (curAppZ) => {
		const openedApps = [...this.state.openedApps]
		let belowApp = null
		openedApps.forEach((app) => {
			if (app.windowRef.current.state.isMinimized) return
			else if (!belowApp && app.zIndex < curAppZ) belowApp = app
			else if (belowApp && (app.zIndex < curAppZ && app.zIndex > belowApp.zIndex)) belowApp = app
		})
		return this.focusApp(belowApp ? belowApp.id : -1)
	}

	focusApp = (curAppID) => {
		const curApp = this.state.openedApps.find((app) => app.id === curAppID)
		if (curApp && curApp.isFocused) return false
		this.setState((prevState) => ({
			openedApps: prevState.openedApps.map((app) => {
				const matched = app.id === curAppID
				return {
					...app,
					isFocused: matched ? true : false,
					zIndex: matched ? ++zIndexLeader : app.zIndex,
				}
			}),
		}))
		return !!curApp
	}

	render() {
		const { mountableApps, isMobile, children } = this.props
		const { openedApps } = this.state
		return (
			<DisplayRoot id='display'>
				{/* SVG pattern loaded inline because of styled-components Firefox bug which causes flickering? */}
				<Background style={{ backgroundImage: `url(${TopographySVG})` }} theme={themes.light} />
				<AllowedDragArea>
					<Shortcuts>
						{mountableApps.map((mountableApp) => (
							<ShortcutButton
								key={mountableApp.shared.title}
								id={`sc-${mountableApp.shared.title}`}
								onClick={() => this.openApp(mountableApp)}
								svg={mountableApp.shared.logo}
								variant='fancy'
								size='large'
							/>
						))}
					</Shortcuts>
					{children}
					<WindowWireframe id='window-wireframe' />
					<TransitionGroup>
						{openedApps.map((app, i) => (
							<Window
								ref={app.windowRef}
								key={app.id}
								id={app.id}
								isMobile={isMobile}
								isFocused={app.isFocused}
								title={app.class.shared.title}
								windowCSS={windowCSS}
								closeApp={this.closeApp}
								focusApp={this.focusApp}
								focusBelowApp={this.focusBelowApp}
								skipRestoreToggleDesktop={this.resetToggleDesktop}
								zIndex={app.zIndex}
							>
								<app.class />
							</Window>
						))}
					</TransitionGroup>
				</AllowedDragArea>
				<Navigation openedApps={openedApps} isMobile={isMobile} toggleDesktop={this.toggleDesktop} />
			</DisplayRoot>
		)
	}
}
