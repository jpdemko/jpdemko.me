// MAYBE - Drag to top to maximize / snapping to left or right to take up half of width.

import React from 'react'
import { TweenMax, Draggable } from 'gsap/all'
import styled, { css } from 'styled-components/macro'

import { getStyleProperty, getBounds } from '../../shared/helpers'
import { sharedCSS, sharedFlags } from '../../shared/variables'
import { ReactComponent as CloseSVG } from '../../shared/icons/material-icons/close.svg'
import { ReactComponent as MinimizeSVG } from '../../shared/icons/material-icons/minimize.svg'
import { ReactComponent as FullscreenExitSVG } from '../../shared/icons/material-icons/fullscreen-exit.svg'
import { ReactComponent as FullscreenSVG } from '../../shared/icons/material-icons/fullscreen.svg'
import Button from '../ui/Button'

// Time in seconds for all GSAP Window Tweens.
const windowAnimDuration = 0.4

const Window = styled.div`
	position: absolute;
	display: flex;
	flex-direction: column;
	opacity: 0;
	${({ windowCSS, isFocused, isMaximized }) => css`
		min-width: ${windowCSS.minWidth}px;
		min-height: ${windowCSS.minHeight}px;
		border: ${isMaximized
			? 'none'
			: `1px solid ${isFocused ? sharedCSS.themes.blue.mainColor : sharedCSS.themes.mono.mainColor}`};
	`}
`

const TitleBar = styled.div`
	padding-left: 0.5em;
	font-weight: 500;
	opacity: 0.9;
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

export default class extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			...props.app.stateFromPrevLayout,
			isFocused: true,
			zIndex: props.getNewZ(),
		}
		this.elementRef = React.createRef()
	}

	static getDerivedStateFromProps(props, state) {
		return {
			isWindowed: !state.isMaximized && !state.isMinimized,
			isFocused: props.zIndexLeader === state.zIndex,
		}
	}

	componentDidMount() {
		const { app, windowCSS } = this.props
		const windowElement = this.elementRef.current

		this.windowDraggable = new Draggable(windowElement, {
			force3D: !sharedFlags.isChrome,
			bounds: '#display',
			edgeResistance: 0.5,
			trigger: `#title-bar-${app.id}`,
			zIndexBoost: false,
			onPress: this.moveOnTop,
			allowContextMenu: true,
		})

		const genResizeDraggable = (target, vars) =>
			new Draggable(target, {
				...vars,
				onPress: () => {
					this.moveOnTop()
					this.windowDraggable.disable()
				},
				onRelease: this.windowDraggable.enable,
				allowContextMenu: true,
			})

		// Get starting snapshot of the bounds from #window-wireframe.
		// Interactable pieces of the Window use these to prevent resizing <= min CSS values.
		// These may also be used for the end of the opening animation (bottom of cDM()).
		let { width, height, top, left } = getBounds('window-wireframe')

		this.dragInstances = [
			this.windowDraggable,
			genResizeDraggable(document.createElement('div'), {
				trigger: `#side-top-${app.id}, #corner-nw-${app.id}, #corner-ne-${app.id}`,
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
				trigger: `#side-right-${app.id}, #corner-ne-${app.id}, #corner-se-${app.id}`,
				cursor: 'e-resize',
				onDrag: function() {
					const preventLowering = width <= windowCSS.minWidth && this.deltaX < 0
					const deltaX = preventLowering ? 0 : this.deltaX
					width += deltaX
					TweenMax.set(windowElement, { width })
				},
			}),
			genResizeDraggable(document.createElement('div'), {
				trigger: `#side-bottom-${app.id}, #corner-sw-${app.id}, #corner-se-${app.id}`,
				cursor: 's-resize',
				onDrag: function() {
					const preventLowering = height <= windowCSS.minHeight && this.deltaY < 0
					const deltaY = preventLowering ? 0 : this.deltaY
					height += deltaY
					TweenMax.set(windowElement, { height })
				},
			}),
			genResizeDraggable(document.createElement('div'), {
				trigger: `#side-left-${app.id}, #corner-nw-${app.id}, #corner-sw-${app.id}`,
				cursor: 'w-resize',
				onDrag: function() {
					const preventLowering = width <= windowCSS.minWidth && this.deltaX > 0
					const deltaX = preventLowering ? 0 : this.deltaX
					width -= deltaX
					TweenMax.set(windowElement, { width, x: `+=${deltaX}` })
				},
			}),
		]

		const shortcut = getBounds(`sc-${app.class.shared.title}`)
		const wdow = getBounds(`sc-${app.class.shared.title}`)
		const openAnimStart = {
			top: shortcut.top - wdow.height / 2,
			left: shortcut.left - wdow.width / 2,
			width,
			height,
			scale: 0.25,
		}
		this.lastWindowedCSS = {
			display: 'flex',
			opacity: 1,
			scale: 1,
			top,
			left,
			width,
			height,
		}
		if (this.props.isMobile) {
			TweenMax.set(windowElement, openAnimStart)
			this.maximize(['skipSetLastWindowedCSS'])
		} else {
			// Clone non-const vars so GSAP doesn't alter them...
			TweenMax.fromTo(windowElement, windowAnimDuration, openAnimStart, { ...this.lastWindowedCSS })
		}
	}

	componentWillUnmount() {
		this.dragInstances.forEach((i) => i.kill())
	}

	minimize = (options = []) => {
		if (this.state.isMinimized) return

		const { top, left } = getBounds(`sc-${this.props.app.class.shared.title}`)
		const { width, height } = getBounds(this.elementRef.current)
		this.animate(
			{
				top: top - height / 2,
				left: left - width / 2,
				x: 0,
				y: 0,
				scale: 0.25,
				opacity: 0,
				display: 'none',
			},
			options,
		)
		if (!options.includes('skipFocusBelowWindow')) this.props.focusBelowWindow(this.props.app)
		this.setState({ isMinimized: true })
	}

	toggleMinimize = () => {
		if (this.state.isMinimized) this.restore()
		else if (!this.moveOnTop()) this.minimize()
	}

	restore = (options) => {
		if (this.state.isMinimized && this.state.isMaximized) {
			this.maximize()
			return
		}

		this.animate(this.lastWindowedCSS, options)
		this.setState({ isMinimized: false, isMaximized: false })
	}

	maximize = (options) => {
		this.animate(
			{
				...this.lastWindowedCSS,
				top: 0,
				left: 0,
				width: '100%',
				height: '100%',
				x: 0,
				y: 0,
				opacity: 1,
				scale: 1,
			},
			options,
		)
		this.setState({ isMinimized: false, isMaximized: true })
	}

	toggleMaximize = () => {
		if (this.state.isMaximized) this.restore()
		else this.maximize()
	}

	animate = (tweenVars, options = []) => {
		if (!options.includes('skipSetLastWindowedCSS')) this.setLastWindowedCSS()
		if (!options.includes('skipMoveOnTop')) this.moveOnTop()
		// Clone non-const vars so GSAP doesn't alter them...
		TweenMax.to(this.elementRef.current, windowAnimDuration, { ...tweenVars })
	}

	setLastWindowedCSS = () => {
		if (!this.state.isWindowed || TweenMax.isTweening(this.elementRef.current)) return
		this.windowDraggable.update()

		const { width, height } = this.elementRef.current.getBoundingClientRect()
		this.lastWindowedCSS = {
			top: getStyleProperty(this.elementRef.current, 'top', true),
			left: getStyleProperty(this.elementRef.current, 'left', true),
			x: this.windowDraggable.x,
			y: this.windowDraggable.y,
			width,
			height,
			scale: 1,
			opacity: 1,
			display: 'flex',
		}
	}

	isOnTop = () => {
		return this.state.zIndex === this.props.zIndexLeader
	}

	moveOnTop = () => {
		if (!this.isOnTop()) {
			this.setState({ zIndex: this.props.getNewZ() })
			return true
		} else return false
	}

	render() {
		const { app, closeApp, isMobile, windowCSS } = this.props
		const { isMaximized, isFocused, zIndex } = this.state
		return (
			<Window
				id={`window-${app.id}`}
				ref={this.elementRef}
				isMaximized={isMaximized}
				isFocused={isFocused}
				windowCSS={windowCSS}
				style={{ zIndex }}
			>
				<TitleBar
					id={`title-bar-${app.id}`}
					isFocused={isFocused}
					isMobile={isMobile}
					onDoubleClick={this.toggleMaximize}
				>
					<div>
						{app.class.shared.title}#{app.id}
					</div>
					<div style={{ display: 'flex', marginLeft: 'auto' }}>
						<Button onClick={() => this.minimize()} SVG={MinimizeSVG} adjustSVG='0, -10%' />
						{isMaximized ? (
							<Button onClick={() => this.restore()} SVG={FullscreenExitSVG} />
						) : (
							<Button onClick={() => this.maximize()} SVG={FullscreenSVG} />
						)}
						<Button onClick={() => closeApp(app)} SVG={CloseSVG} />
					</div>
				</TitleBar>
				<div id='content-overflow-fix' style={{ overflowY: 'auto', flex: 1 }}>
					<Content onClick={this.moveOnTop}>{this.props.children}</Content>
				</div>
				<Side position='top' id={`side-top-${app.id}`} />
				<Side position='right' id={`side-right-${app.id}`} />
				<Side position='bottom' id={`side-bottom-${app.id}`} />
				<Side position='left' id={`side-left-${app.id}`} />
				<CornerNW id={`corner-nw-${app.id}`} />
				<CornerNE id={`corner-ne-${app.id}`} />
				<CornerSE id={`corner-se-${app.id}`} />
				<CornerSW id={`corner-sw-${app.id}`} />
			</Window>
		)
	}
}
