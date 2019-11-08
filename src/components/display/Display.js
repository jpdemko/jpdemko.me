import React from 'react'
import styled, { css } from 'styled-components/macro'
import { TransitionGroup } from 'react-transition-group'

import TopographySVG from '../../shared/assets/backgrounds/topography.svg'
import { themes } from '../../shared/shared'
import Button from '../ui/Button'
import Window from './Window'
import Navigation from './Navigation'
import App from './App'

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div`
	height: 100%;
	display: flex;
	flex-direction: column;
	overflow: hidden;
`

const AllowedDragArea = styled.div`
	position: relative;
	flex: 1;
`

const Background = styled.div`
	position: absolute;
	z-index: -1;
	top: 0;
	left: 0;
	height: 100%;
	width: 100%;
	opacity: 0.8;
	${({ theme }) => css`
		background-color: ${theme.mainColor};
	`}
`

// Only shared between Display/Window, doesn't really belong in 'variables.js' file, which is used everywhere.
const minWindowCSS = {
	minWidth: 480,
	minHeight: 320,
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
		min-width: ${isMobileSite ? 120 : minWindowCSS.minWidth}px;
		min-height: ${isMobileSite ? 80 : minWindowCSS.minHeight}px;
		width: ${isMobileSite ? 100 : 65}%;
		height: ${isMobileSite ? 100 : 60}%;
	`}
`

const Shortcuts = styled.div`
	height: 100%;
	position: relative;
	z-index: 10; /* Need this because of absolute positioned background div */
	display: flex;
	flex-wrap: wrap;
	align-items: flex-start;
	align-content: flex-start;
	justify-content: flex-start;
	> * {
		flex: 0 0 auto;
	}
`

const ShortcutButton = styled(Button)`
	height: 4em;
	width: 4em;
	padding: 0.5em;
	margin: 1em 0 0 1em;
`

/* -------------------------------- COMPONENT ------------------------------- */

// GSAP's Draggable has a shared z-index updater across all instances, however it doesn't update
// in every circumstance we need it to.
let zIndexLeader = 999

// Each app gets a unique ID for their React key prop.
let uniqueID = 0

export default class Display extends React.Component {
	state = {
		openedApps: [],
		mobileMenuCallback: null,
	}
	recentlyMinimizedApps = []
	skipRestoreToggleDesktop = true

	componentDidUpdate(prevProps) {
		if (prevProps.isMobileSite !== this.props.isMobileSite) {
			this.state.openedApps.forEach((app) => {
				const wdow = app.windowRef.current
				if (this.props.isMobileSite) {
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
		if (!this.props.isMobileSite && !this.skipRestoreToggleDesktop && this.recentlyMinimizedApps.length > 0) {
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

	setMobileMenuCallback = (mobileMenuCallback) => this.setState({ mobileMenuCallback })

	render() {
		const { mountableApps, isMobileSite, children } = this.props
		const { openedApps, mobileMenuCallback } = this.state
		return (
			<Root id='display'>
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
								theme={mountableApp.shared.theme}
							/>
						))}
					</Shortcuts>
					{children}
					<WindowWireframe id='window-wireframe' isMobileSite={isMobileSite} />
					<TransitionGroup>
						{openedApps.map((app, i) => (
							<Window
								ref={app.windowRef}
								key={app.id}
								id={app.id}
								isMobileSite={isMobileSite}
								isFocused={app.isFocused}
								title={app.class.shared.title}
								minWindowCSS={minWindowCSS}
								closeApp={this.closeApp}
								focusApp={this.focusApp}
								focusBelowApp={this.focusBelowApp}
								skipRestoreToggleDesktop={this.resetToggleDesktop}
								zIndex={app.zIndex}
							>
								<App isFocused={app.isFocused} setMobileMenuCallback={this.setMobileMenuCallback} app={app} />
							</Window>
						))}
					</TransitionGroup>
				</AllowedDragArea>
				<Navigation
					openedApps={openedApps}
					isMobileSite={isMobileSite}
					toggleDesktop={this.toggleDesktop}
					mobileMenuCallback={mobileMenuCallback}
				/>
			</Root>
		)
	}
}
