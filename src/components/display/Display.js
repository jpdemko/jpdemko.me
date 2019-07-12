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

let uniqueID = 0

export default class Display extends React.Component {
	state = {
		// GSAP's Draggable has a shared z-index updater across all instances, however it doesn't update
		// in every circumstance we need it to.
		zIndexLeader: 999,
		openedApps: [],
	}
	recentlyMinimizedApps = []
	skipRestore = true

	componentDidUpdate(prevProps) {
		if (prevProps.isMobile !== this.props.isMobile) {
			this.state.openedApps.forEach((app) => {
				const wdow = app.windowRef.current
				if (this.props.isMobile) {
					app.stateFromPrevLayout = wdow.state
					if (wdow.isOnTop() && !wdow.state.isMinimized) wdow.maximize()
					else wdow.minimize(['skipFocusBelowWindow', 'skipMoveOnTop'])
				} else {
					const { isMaximized: wasMax, isWindowed: wasWindow } = app.stateFromPrevLayout
					if (wasMax) wdow.maximize(['skipMoveOnTop'])
					else if (wasWindow) wdow.restore(['skipMoveOnTop'])
				}
			})
		}
	}

	openApp = (app) => {
		const { isMobile } = this.props
		this.setState((prevState) => ({
			openedApps: [
				...prevState.openedApps,
				{
					id: ++uniqueID,
					windowRef: React.createRef(),
					class: app,
					stateFromPrevLayout: {
						isMinimized: false,
						isMaximized: isMobile ? true : false,
						isWindowed: isMobile ? false : true,
					},
				},
			],
		}))
		this.skipRestoreToggleDesktop()
	}

	closeApp = (curApp) => {
		this.setState((prevState) => ({
			openedApps: prevState.openedApps.filter((app) => app.id !== curApp.id),
		}))
		this.focusBelowWindow(curApp)
	}

	// Mimics Win10 desktop toggle or iOS/Android home button.
	toggleDesktop = () => {
		if (!this.props.isMobile && !this.skipRestore && this.recentlyMinimizedApps.length > 0) {
			this.recentlyMinimizedApps.forEach((app) => {
				if (app) app.windowRef.current.restore(['skipMoveOnTop'])
			})
			this.recentlyMinimizedApps = []
		} else {
			this.state.openedApps.forEach((app) => {
				if (!app.windowRef.current.state.isMinimized) {
					this.recentlyMinimizedApps.push(app)
					app.windowRef.current.minimize(['skipFocusBelowWindow', 'skipMoveOnTop'])
				}
			})
			this.skipRestore = false
		}
	}

	skipRestoreToggleDesktop = () => {
		this.skipRestore = true
	}

	focusBelowWindow = (curApp) => {
		if (this.state.openedApps.length < 2) return
		const curZ = curApp.windowRef.current.state.zIndex
		let belowApp = null
		this.state.openedApps.forEach((app, i) => {
			const appZ = app.windowRef.current.state.zIndex
			if (app.windowRef.current.state.isMinimized) return
			else if (!belowApp && appZ < curZ) belowApp = app
			else if (belowApp) {
				const belowAppZ = belowApp.windowRef.current.state.zIndex
				belowApp = appZ > belowAppZ && appZ < curZ ? app : belowApp
			}
		})
		if (belowApp) belowApp.windowRef.current.moveOnTop()
	}

	getNewZ = () => {
		const { zIndexLeader } = this.state
		this.setState({ zIndexLeader: zIndexLeader + 1 })
		return zIndexLeader + 1
	}

	render() {
		const { mountableApps, isMobile } = this.props
		const { openedApps, zIndexLeader } = this.state
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
					{openedApps.map((app) => (
						<Window
							key={app.id}
							ref={app.windowRef}
							app={app}
							closeApp={this.closeApp}
							isMobile={isMobile}
							focusBelowWindow={this.focusBelowWindow}
							zIndexLeader={zIndexLeader}
							getNewZ={this.getNewZ}
							windowCSS={windowCSS}
							skipRestoreToggleDesktop={this.skipRestoreToggleDesktop}
						>
							<app.class />
						</Window>
					))}
				</TransitionGroup>
			</DisplayRoot>
		)
	}
}
