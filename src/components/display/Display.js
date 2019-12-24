import React from 'react'
import styled, { css } from 'styled-components/macro'
import { TransitionGroup } from 'react-transition-group'

import TopographySVG from '../../shared/assets/backgrounds/topography.svg'
import { themes } from '../../shared/shared'
import Button from '../ui/Button'
import Window from './Window'
import Taskbar from './Taskbar'
import AppNav from './AppNav'

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div`
	height: 100%;
	display: flex;
	flex-direction: column;
	overflow: hidden;
`

const AllowedDragArea = styled.div`
	position: relative;
	flex: 1 1 auto;
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
	font-size: 0.8rem;
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
	margin: 1em 0 0 1em;
	display: flex;
	flex-direction: column;
	&& > *:first-child {
		width: 100%;
		height: auto;
	}
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
		toggleFocusedAppNavDrawer: null,
	}

	openApp = (app) => {
		const { openedApps } = this.state
		const curOpenApp = openedApps.find((oApp) => oApp.class === app)
		if (curOpenApp) {
			curOpenApp.windowRef.current.toggleMinimize()
			return
		}
		const newApp = {
			id: ++uniqueID,
			windowRef: React.createRef(),
			class: app,
			isFocused: true,
			zIndex: ++zIndexLeader,
		}
		let nextOpenedApps = [...openedApps] // Copy currently opened apps array.
		nextOpenedApps.forEach((app) => (app.isFocused = false)) // New app is focused, old ones aren't.
		nextOpenedApps.push(newApp) // Add new app data to opened apps array copy.
		this.setState({ openedApps: nextOpenedApps })
	}

	closeApp = (curAppID) => {
		// Don't need to 'focusBelowApp' since 'minimize()' will call it from the Window component.
		this.setState((prevState) => ({
			openedApps: prevState.openedApps.filter((app) => app.id !== curAppID),
			focusedAppNavContent: null,
		}))
	}

	handleHomeButton = () => {
		this.state.openedApps.forEach((app) => app.windowRef.current.minimize())
	}

	focusBelowApp = (curAppZ) => {
		const openedApps = [...this.state.openedApps]
		let belowApp = null
		openedApps.forEach((app) => {
			if (app.windowRef.current.animStates.isMinimized) return
			else if (!belowApp && app.zIndex < curAppZ) belowApp = app
			else if (belowApp && app.zIndex < curAppZ && app.zIndex > belowApp.zIndex) belowApp = app
		})
		return this.focusApp(belowApp ? belowApp.id : -1)
	}

	focusApp = (curAppID) => {
		const curApp = this.state.openedApps.find((app) => app.id === curAppID)
		if (curApp && curApp.isFocused) return false

		let matched = false
		const nextOpenedApps = [...this.state.openedApps].map((app) => {
			matched = app.id === curAppID
			return {
				...app,
				isFocused: matched ? true : false,
				zIndex: matched ? ++zIndexLeader : app.zIndex,
			}
		})
		this.setState({
			openedApps: nextOpenedApps,
			...(!matched && { toggleFocusedAppNavDrawer: null }),
		})
		return matched
	}

	setToggleFocusedAppNavDrawer = (toggleFocusedAppNavDrawer) => {
		this.setState({ toggleFocusedAppNavDrawer })
	}

	render() {
		return (
			<Root>
				{/* SVG pattern loaded inline because of styled-components Firefox bug which causes flickering? */}
				<Background style={{ backgroundImage: `url(${TopographySVG})` }} theme={themes.light} />
				<AllowedDragArea id='allowedDragArea'>
					<Shortcuts>
						{this.props.mountableApps.map((mountableApp, i) => {
							if (!mountableApp.shared) {
								mountableApp.shared = {
									title: `App#${new Date().getTime()}`,
									logo: () => <span>?</span>,
									theme: themes.blue,
								}
							}
							const { title, logo, theme } = mountableApp.shared
							return (
								<ShortcutButton
									key={title}
									onClick={() => this.openApp(mountableApp)}
									variant='fancy'
									size='large'
									svg={logo}
									theme={theme}
								>
									{title}
								</ShortcutButton>
							)
						})}
					</Shortcuts>
					{this.props.children}
					<WindowWireframe id='window-wireframe' isMobileSite={this.props.isMobileSite} />
					<TransitionGroup>
						{this.state.openedApps.map((app, i) => (
							<Window
								ref={app.windowRef}
								key={app.id}
								id={app.id}
								isMobileSite={this.props.isMobileSite}
								isFocused={app.isFocused}
								title={app.class.shared.title}
								minWindowCSS={minWindowCSS}
								closeApp={this.closeApp}
								focusApp={this.focusApp}
								focusBelowApp={this.focusBelowApp}
								zIndex={app.zIndex}
							>
								<AppNav
									isFocused={app.isFocused}
									isMobileSite={this.props.isMobileSite}
									setToggleFocusedAppNavDrawer={this.setToggleFocusedAppNavDrawer}
									app={app}
								/>
							</Window>
						))}
					</TransitionGroup>
				</AllowedDragArea>
				<Taskbar
					openedApps={this.state.openedApps}
					isMobileSite={this.props.isMobileSite}
					handleHomeButton={this.handleHomeButton}
					toggleFocusedAppNavDrawer={this.state.toggleFocusedAppNavDrawer}
					closeApp={this.closeApp}
				/>
			</Root>
		)
	}
}
