import React from 'react'
import styled from 'styled-components/macro'
import { TransitionGroup } from 'react-transition-group'

import Button from '../ui/Button'
import Window from './Window'
import Navigation from './Navigation'

const DisplayRoot = styled.div`
	height: 100vh;
	position: relative;
	overflow: hidden;
	padding: 1em;
	/* background-image: url('https://w.wallhaven.cc/full/r2/wallhaven-r27qy1.jpg');
	background-size: cover;
	background-repeat: no-repeat;
	background-position: center center; */
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
	display: flex;
	flex-direction: column;
	align-items: flex-start;
`

const ShortcutButton = styled(Button)`
	font-size: 2em;
	margin: 0.5em;
`

// GSAP's Draggable has a shared z-index updater across all instances, however it doesn't update
// in every circumstance we need it to.
let zIndexLeader = 999

// Each app gets a unique ID for their key attribute.
let uniqueID = 0

export default class Display extends React.Component {
	state = {
		openedApps: [],
	}
	recentlyMinimizedApps = []
	currentlyFocusedAppID = null
	skipRestore = true

	componentDidUpdate(prevProps) {
		if (prevProps.isMobile !== this.props.isMobile) {
			this.state.openedApps.forEach((app) => {
				const wdow = app.windowRef.current
				if (!app.stateBeforeLayoutChange) app.stateBeforeLayoutChange = wdow.state
				if (this.props.isMobile) {
					if (wdow.isOnTop() && !wdow.state.isMinimized) wdow.maximize()
					else wdow.minimize(['skipFocusBelowApp', 'skipFocusApp'])
				} else {
					const { isMaximized: wasMax, isWindowed: wasWindow } = app.stateBeforeLayoutChange
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
		this.currentlyFocusedAppID = newApp.id // Set new app's ID as the one currently focused.
		nextOpenedApps.push(newApp) // Add new app data to opened apps array copy.
		this.setState({ openedApps: nextOpenedApps })
		this.skipRestoreToggleDesktop()
	}

	closeApp = (curAppID) => {
		// Don't need to 'focusBelowApp' since 'minimize()' will call it from the Window component.
		this.setState((prevState) => ({
			openedApps: prevState.openedApps.filter((app) => app.id !== curAppID),
		}))
	}

	// Mimics Win10 desktop toggle or iOS/Android home button.
	toggleDesktop = () => {
		if (!this.props.isMobile && !this.skipRestore && this.recentlyMinimizedApps.length > 0) {
			this.recentlyMinimizedApps.forEach((app) => {
				if (app) app.windowRef.current.restore(['skipFocusApp'])
			})
			this.recentlyMinimizedApps = []
		} else {
			this.state.openedApps.forEach((app) => {
				if (!app.windowRef.current.state.isMinimized) {
					this.recentlyMinimizedApps.push(app)
					app.windowRef.current.minimize(['skipFocusBelowApp', 'skipFocusApp'])
				}
			})
			this.skipRestore = false
		}
	}

	skipRestoreToggleDesktop = () => {
		this.skipRestore = true
	}

	focusBelowApp = (curAppZ) => {
		const openedApps = [...this.state.openedApps]
		if (openedApps.length < 1) return false
		let belowApp = null
		openedApps.forEach((app) => {
			if (!belowApp || (app.zIndex < curAppZ && app.zIndex > belowApp.zIndex)) belowApp = app
		})
		return belowApp.isFocused ? false : this.focusApp(belowApp.id)
	}

	focusApp = (curAppID) => {
		const curApp = this.state.openedApps.find((app) => app.id === curAppID)
		if (!curApp || curApp.isFocused) return false
		this.setState((prevState) => ({
			openedApps: prevState.openedApps.map((app) => {
				const matched = app.id === curAppID
				if (matched) this.currentlyFocusedAppID = app.id
				return {
					...app,
					isFocused: matched ? true : false,
					zIndex: matched ? ++zIndexLeader : app.zIndex,
				}
			}),
		}))
		return true
	}

	render() {
		const { mountableApps, isMobile } = this.props
		const { openedApps } = this.state
		return (
			<DisplayRoot id='display'>
				<Shortcuts>
					{mountableApps.map((mountableApp) => (
						<ShortcutButton
							key={mountableApp.shared.title}
							id={`sc-${mountableApp.shared.title}`}
							onClick={() => this.openApp(mountableApp)}
							SVG={mountableApp.shared.logo}
							variant='fancy'
							size='large'
						/>
					))}
				</Shortcuts>
				<Navigation openedApps={openedApps} isMobile={isMobile} toggleDesktop={this.toggleDesktop} />
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
							skipRestoreToggleDesktop={this.skipRestoreToggleDesktop}
							zIndex={app.zIndex}
						>
							<app.class />
						</Window>
					))}
				</TransitionGroup>
			</DisplayRoot>
		)
	}
}
