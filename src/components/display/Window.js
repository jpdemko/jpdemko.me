// MAYBE - Drag to top to maximize / snapping to left or right to take up half of width.

import React from 'react'
import { TweenMax, Draggable } from 'gsap/all'
import styled, { css } from 'styled-components/macro'
import { Transition } from 'react-transition-group'

import { ReactComponent as CloseSVG } from '../../shared/icons/material-icons/close.svg'
import { ReactComponent as MinimizeSVG } from '../../shared/icons/material-icons/minimize.svg'
import { ReactComponent as FullscreenSVG } from '../../shared/icons/material-icons/fullscreen.svg'
import { ReactComponent as FullscreenExitSVG } from '../../shared/icons/material-icons/fullscreen-exit.svg'
import Button from '../ui/Button'
import { getStyleProperty, getRect } from '../../shared/helpers'
import { sharedCSS, sharedFlags } from '../../shared/variables'

// Time in seconds for all GSAP Window Tweens.
const windowAnimDuration = 0.4

const WindowRoot = styled.div`
	position: absolute;
	display: flex;
	flex-direction: column;
	max-width: 100vw;
	max-height: 100vh;
	${({ windowCSS, zIndex, isFocused, isMobile, isMaximized }) => css`
		${!isMobile &&
			css`
				min-height: ${windowCSS.minHeight}px;
				min-width: ${windowCSS.minWidth}px;
			`}
		z-index: ${zIndex};
		border: ${
			isMaximized
				? 'none'
				: `1px solid ${isFocused ? sharedCSS.themes.blue.mainColor : sharedCSS.themes.mono.mainColor}`
		};
	`}
`

const TitleBar = styled.div`
	padding-left: 0.5em;
	font-weight: 500;
	opacity: 0.9;
	align-items: center;
	${({ isMobile, isFocused }) => css`
		display: ${isMobile ? 'none' : 'flex'};
		background-color: ${isFocused ? sharedCSS.themes.blue.altColor : sharedCSS.themes.mono.altColor};
		${isFocused && sharedCSS.themes.blue.gradient}
		div, button {
			color: ${isFocused ? 'white' : sharedCSS.themes.mono.mainColor};
		}
	`}
`

const Content = styled.div`
	height: 100%;
	background: white;
`

// Change this to control proportions of offset and the Corner styled-component!
const sideSize = '0.25em'
const sideOffset = `calc(${sideSize} / 2 * -1)`
const Side = styled.div.attrs(({ position }) => ({
	style: {
		[position]: sideOffset,
	},
}))`
	position: absolute;
	${({ position }) =>
		['top', 'bottom'].indexOf(position) > -1
			? css`
					height: ${sideSize};
					width: 100%;
			  `
			: css`
					height: 100%;
					width: ${sideSize};
			  `}
`

const cornerSize = `calc(${sideSize} * 2)`
const cornerOffset = `calc(${sideSize} * -1)`
const Corner = styled.div`
	position: absolute;
	height: ${cornerSize};
	width: ${cornerSize};
`

const CornerNW = styled(Corner)`
	top: ${cornerOffset};
	left: ${cornerOffset};
	cursor: nw-resize !important;
`

const CornerNE = styled(Corner)`
	top: ${cornerOffset};
	right: ${cornerOffset};
	cursor: ne-resize !important;
`

const CornerSE = styled(Corner)`
	bottom: ${cornerOffset};
	right: ${cornerOffset};
	cursor: se-resize !important;
`
const CornerSW = styled(Corner)`
	bottom: ${cornerOffset};
	left: ${cornerOffset};
	cursor: sw-resize !important;
`

export default class Window extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			isMinimized: false,
			isMaximized: props.isMobile ? true : false,
		}

		this.rootRef = React.createRef()

		const shortcut = getRect(`sc-${props.title}`)
		const wireframe = getRect('window-wireframe')
		this.difStatesCSS = {
			minimized: {
				top: shortcut.top - wireframe.height / 2,
				left: shortcut.left - wireframe.width / 2,
				width: wireframe.width,
				height: wireframe.height,
				scale: 0.25,
				opacity: 0,
				display: 'none',
			},
			windowed: {
				display: 'flex',
				opacity: 1,
				scale: 1,
				top: wireframe.top,
				left: wireframe.left,
				width: wireframe.width,
				height: wireframe.height,
			},
			maximized: {
				top: 0,
				left: 0,
				width: '100%',
				height: '100%',
				x: 0,
				y: 0,
				opacity: 1,
				scale: 1,
				display: 'flex',
			},
		}
	}

	static getDerivedStateFromProps(props, state) {
		return {
			isWindowed: !state.isMaximized && !state.isMinimized,
		}
	}

	componentDidMount() {
		const { id, focusApp, windowCSS } = this.props
		const windowElement = this.rootRef.current

		this.windowDraggable = new Draggable(windowElement, {
			force3D: !sharedFlags.isChrome,
			bounds: '#display',
			edgeResistance: 0.5,
			trigger: `#title-bar-${id}`,
			zIndexBoost: false,
			onPress: () => focusApp(id),
			allowContextMenu: true,
		})

		const genResizeDraggable = (target, vars) =>
			new Draggable(target, {
				...vars,
				onPress: () => {
					focusApp(id)
					this.windowDraggable.disable()
				},
				onRelease: this.windowDraggable.enable,
				allowContextMenu: true,
			})

		// Get starting snapshot of the bounds from #window-wireframe.
		// Interactable pieces of the Window use these to prevent resizing <= min CSS values.
		// These may also be used for the end of the opening animation (bottom of cDM()).
		let { width, height } = getRect('window-wireframe')

		this.dragInstances = [
			this.windowDraggable,
			genResizeDraggable(document.createElement('div'), {
				trigger: `#side-top-${id}, #corner-nw-${id}, #corner-ne-${id}`,
				cursor: 'n-resize',
				onDrag: function() {
					const preventLowering = height <= windowCSS.minHeight && this.deltaY > 0
					const deltaY = preventLowering ? 0 : this.deltaY
					height -= deltaY
					TweenMax.set(windowElement, {
						height,
						y: `+=${deltaY}`,
					})
				},
			}),
			genResizeDraggable(document.createElement('div'), {
				trigger: `#side-right-${id}, #corner-ne-${id}, #corner-se-${id}`,
				cursor: 'e-resize',
				onDrag: function() {
					const preventLowering = width <= windowCSS.minWidth && this.deltaX < 0
					const deltaX = preventLowering ? 0 : this.deltaX
					width += deltaX
					TweenMax.set(windowElement, { width })
				},
			}),
			genResizeDraggable(document.createElement('div'), {
				trigger: `#side-bottom-${id}, #corner-sw-${id}, #corner-se-${id}`,
				cursor: 's-resize',
				onDrag: function() {
					const preventLowering = height <= windowCSS.minHeight && this.deltaY < 0
					const deltaY = preventLowering ? 0 : this.deltaY
					height += deltaY
					TweenMax.set(windowElement, { height })
				},
			}),
			genResizeDraggable(document.createElement('div'), {
				trigger: `#side-left-${id}, #corner-nw-${id}, #corner-sw-${id}`,
				cursor: 'w-resize',
				onDrag: function() {
					const preventLowering = width <= windowCSS.minWidth && this.deltaX > 0
					const deltaX = preventLowering ? 0 : this.deltaX
					width -= deltaX
					TweenMax.set(windowElement, { width, x: `+=${deltaX}` })
				},
			}),
		]
	}

	componentWillUnmount() {
		this.dragInstances.forEach((i) => i.kill())
	}

	minimize = (options = []) => {
		if (this.state.isMinimized) return

		this.animate(this.difStatesCSS.minimized, options)
		if (!options.includes('skipFocusBelowApp')) this.props.focusBelowApp(this.props.id)
		this.setState({ isMinimized: true })
	}

	toggleMinimize = () => {
		if (this.state.isMinimized) this.restore()
		else if (!this.props.focusApp(this.props.id)) this.minimize()
	}

	restore = (options) => {
		if (this.state.isMinimized && this.state.isMaximized) {
			this.maximize()
			return
		}

		this.animate(this.difStatesCSS.windowed, options)
		this.setState({ isMinimized: false, isMaximized: false })
	}

	maximize = (options) => {
		this.animate(this.difStatesCSS.maximized, options)
		this.setState({ isMinimized: false, isMaximized: true })
	}

	toggleMaximize = () => {
		if (this.state.isMaximized) this.restore()
		else this.maximize()
	}

	animate = (tweenVars, options = []) => {
		if (!options.includes('skipSetLastWindowedCSS')) this.setLastWindowedCSS()
		if (!options.includes('skipFocusApp')) this.props.focusApp(this.props.id)
		this.props.skipRestoreToggleDesktop()
		// Clone non-const vars so GSAP doesn't alter them...
		TweenMax.to(this.rootRef.current, windowAnimDuration, { ...tweenVars })
	}

	setLastWindowedCSS = () => {
		if (!this.state.isWindowed || TweenMax.isTweening(this.rootRef.current)) return
		this.windowDraggable.update()

		const { width, height } = this.rootRef.current.getBoundingClientRect()
		this.difStatesCSS.windowed = {
			top: getStyleProperty(this.rootRef.current, 'top', true),
			left: getStyleProperty(this.rootRef.current, 'left', true),
			x: this.windowDraggable.x,
			y: this.windowDraggable.y,
			width,
			height,
			scale: 1,
			opacity: 1,
			display: 'flex',
		}
	}

	render() {
		const { id, title, isMobile, isFocused, zIndex, windowCSS, in: show } = this.props
		const { closeApp, focusApp } = this.props
		const { isMaximized } = this.state
		return (
			<Transition
				unmountOnExit={true}
				timeout={windowAnimDuration * 1000}
				in={show}
				onEnter={(node) => {
					const { minimized, windowed, maximized } = this.difStatesCSS
					if (isMobile) TweenMax.fromTo(node, windowAnimDuration, minimized, maximized)
					else TweenMax.fromTo(node, windowAnimDuration, minimized, windowed)
				}}
				onExit={() => this.minimize()}
			>
				<WindowRoot
					id={`window-${id}`}
					ref={this.rootRef}
					isMaximized={isMaximized}
					isFocused={isFocused}
					isMobile={isMobile}
					windowCSS={windowCSS}
					zIndex={zIndex}
				>
					<TitleBar
						id={`title-bar-${id}`}
						isFocused={isFocused}
						isMobile={false}
						onDoubleClick={this.toggleMaximize}
					>
						<div>
							{title}#{id}
						</div>
						<div style={{ display: 'flex', marginLeft: 'auto' }}>
							<Button onClick={() => this.minimize()} SVG={MinimizeSVG} />
							{isMaximized ? (
								<Button onClick={() => this.restore()} SVG={FullscreenExitSVG} />
							) : (
								<Button onClick={() => this.maximize()} SVG={FullscreenSVG} />
							)}
							<Button onClick={() => closeApp(id)} SVG={CloseSVG} />
						</div>
					</TitleBar>
					<div id='content-overflow-fix' style={{ overflowY: 'auto', flex: 1 }}>
						<Content onClick={() => focusApp(id)}>{this.props.children}</Content>
					</div>
					<Side position='top' id={`side-top-${id}`} />
					<Side position='right' id={`side-right-${id}`} />
					<Side position='bottom' id={`side-bottom-${id}`} />
					<Side position='left' id={`side-left-${id}`} />
					<CornerNW id={`corner-nw-${id}`} />
					<CornerNE id={`corner-ne-${id}`} />
					<CornerSE id={`corner-se-${id}`} />
					<CornerSW id={`corner-sw-${id}`} />
				</WindowRoot>
			</Transition>
		)
	}
}
