// MAYBE - Drag to top to maximize / snapping to left or right to take up half of width.

import React from 'react'
import { TweenMax, Draggable } from 'gsap/all'
import styled, { css } from 'styled-components/macro'
import { Transition } from 'react-transition-group'

import { ReactComponent as svgClose } from '../../shared/assets/material-icons/close.svg'
import { ReactComponent as svgMinimize } from '../../shared/assets/material-icons/minimize.svg'
import { ReactComponent as svgFullscreenExit } from '../../shared/assets/material-icons/fullscreen-exit.svg'
import { ReactComponent as svgFullscreen } from '../../shared/assets/material-icons/fullscreen.svg'
import { getStyleProperty, getRect, isDoubleTouch, opac } from '../../shared/helpers'
import { sharedFlags, themes, mediaBreakpoints } from '../../shared/variables'
import Button from '../ui/Button'

/* ---------------------------- STYLED-COMPONENTS --------------------------- */

// Time in seconds for all GSAP Window Tweens.
const windowAnimDuration = 0.4

const WindowRoot = styled.div`
	position: absolute;
	display: flex;
	flex-direction: column;
	max-width: 100vw;
	max-height: 100vh;
	${({ windowCSS, zIndex, isFocused, isMobile, isMaximized, theme }) => css`
		z-index: ${zIndex};
		${!isMobile &&
			css`
				min-height: ${windowCSS.minHeight}px;
				min-width: ${windowCSS.minWidth}px;
			`}
		border: ${isMaximized ? 'none' : `1px solid ${theme.mixedColor}`};
		/* Might have to take the shadow out because performance isn't that great w/ it... */
		filter: ${isFocused ? `drop-shadow(0 1px 12px ${opac(0.3, theme.mixedColor)})` : 'none'};
	`}
`

const TitleBar = styled.div`
	padding-left: 0.5em;
	font-weight: 500;
	opacity: 0.9;
	align-items: center;
	${({ isMobile, isFocused, theme }) => css`
		color: ${theme.bgContrastColor};
		display: ${isMobile ? 'none' : 'flex'};
		${isFocused ? theme.gradient : theme.gradient}
	`}
`

const Content = styled.div`
	flex: 1;
	position: relative;
	> div {
		overflow-y: auto;
		height: 100%;
	}
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
		['top', 'bottom'].includes(position)
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

/* ---------------------------- WINDOW COMPONENT ---------------------------- */

export const WindowSizeContext = React.createContext()

export default class Window extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			isMinimized: false,
			isMaximized: props.isMobile,
			isMobileSizedWindow: props.isMobile,
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
				x: 0,
				y: 0,
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
		if (props.isMobile && !state.isMobileSizedWindow) return { isMobileSizedWindow: true }
		return null
	}

	componentDidMount() {
		const { id, focusApp, windowCSS, isMobile } = this.props
		const windowElement = this.rootRef.current

		this.windowDraggable = new Draggable(windowElement, {
			activeCursor: 'grabbing',
			cursor: 'grab',
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

		// Grab rect of #window-wireframe which is used as opening location.
		let { width, height } = getRect('window-wireframe')
		// Interactable sides/corners use these values to prevent resizing <= min CSS values.
		this.windowRect = { width, height }
		this.checkMediaSize()
		// Creating local references to prevent 'this' conflicts.
		let windowRect = this.windowRect
		const checkMediaSize = this.checkMediaSize

		this.dragInstances = [
			this.windowDraggable,
			genResizeDraggable(document.createElement('div'), {
				trigger: `#side-top-${id}, #corner-nw-${id}, #corner-ne-${id}`,
				cursor: 'n-resize',
				onDrag: function() {
					const preventLowering = windowRect.height <= windowCSS.minHeight && this.deltaY > 0
					const deltaY = preventLowering ? 0 : this.deltaY
					windowRect.height -= deltaY
					TweenMax.set(windowElement, {
						height: windowRect.height,
						y: `+=${deltaY}`,
					})
				},
			}),
			genResizeDraggable(document.createElement('div'), {
				trigger: `#side-right-${id}, #corner-ne-${id}, #corner-se-${id}`,
				cursor: 'e-resize',
				onDrag: function() {
					const preventLowering = windowRect.width <= windowCSS.minWidth && this.deltaX < 0
					const deltaX = preventLowering ? 0 : this.deltaX
					windowRect.width += deltaX
					checkMediaSize()
					TweenMax.set(windowElement, { width: windowRect.width })
				},
			}),
			genResizeDraggable(document.createElement('div'), {
				trigger: `#side-bottom-${id}, #corner-sw-${id}, #corner-se-${id}`,
				cursor: 's-resize',
				onDrag: function() {
					const preventLowering = windowRect.height <= windowCSS.minHeight && this.deltaY < 0
					const deltaY = preventLowering ? 0 : this.deltaY
					windowRect.height += deltaY
					TweenMax.set(windowElement, { height: windowRect.height })
				},
			}),
			genResizeDraggable(document.createElement('div'), {
				trigger: `#side-left-${id}, #corner-nw-${id}, #corner-sw-${id}`,
				cursor: 'w-resize',
				onDrag: function() {
					const preventLowering = windowRect.width <= windowCSS.minWidth && this.deltaX > 0
					const deltaX = preventLowering ? 0 : this.deltaX
					windowRect.width -= deltaX
					checkMediaSize()
					TweenMax.set(windowElement, { width: windowRect.width, x: `+=${deltaX}` })
				},
			}),
		]
		if (isMobile) this.dragInstances.forEach((i) => i.disable())
	}

	componentWillUnmount() {
		this.dragInstances.forEach((i) => i.kill())
	}

	componentDidUpdate(prevProps, prevState) {
		if (prevProps.isMobile !== this.props.isMobile) {
			this.dragInstances.forEach((i) => i.enabled(!this.props.isMobile))
		}
		const { isMaximized, isMinimized, isWindowed } = this.state
		if (isWindowed && (isMaximized || isMinimized)) this.setState({ isWindowed: false })
		else if (!isWindowed && (!isMaximized && !isMinimized)) this.setState({ isWindowed: true })
	}

	checkMediaSize = () => {
		const { isMobileSizedWindow } = this.state
		if (!isMobileSizedWindow && this.windowRect.width < mediaBreakpoints.desktop)
			this.setState({ isMobileSizedWindow: true })
		else if (isMobileSizedWindow && this.windowRect.width >= mediaBreakpoints.desktop)
			this.setState({ isMobileSizedWindow: false })
	}

	minimize = (options = []) => {
		if (this.state.isMinimized) return

		const { isFocused, focusBelowApp, zIndex } = this.props
		this.animate(this.difStatesCSS.minimized, [...options, 'skipFocusApp'])
		if (!options.includes('skipFocusBelowApp') && isFocused) focusBelowApp(zIndex)
		this.setState({ isMinimized: true })
	}

	toggleMinimize = () => {
		if (this.state.isMinimized) {
			if (this.props.isMobile) this.maximize()
			else this.restore()
		} else if (!this.props.focusApp(this.props.id)) this.minimize()
	}

	restore = (options) => {
		if (this.state.isMinimized && this.state.isMaximized) {
			this.maximize(options)
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
		// Creating local references to prevent 'this' conflicts.
		let windowRect = this.windowRect
		const checkMediaSize = this.checkMediaSize
		// Clone non-const vars so GSAP doesn't alter them...
		TweenMax.to(this.rootRef.current, windowAnimDuration, {
			...tweenVars,
			onComplete: () => this.windowDraggable.update(true),
			onUpdate: function() {
				windowRect.width = this.target.offsetWidth
				windowRect.height = this.target.offsetHeight
				checkMediaSize()
			},
		})
	}

	setLastWindowedCSS = () => {
		if (!this.state.isWindowed || TweenMax.isTweening(this.rootRef.current)) return
		this.windowDraggable.update(true)

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
				unmountOnExit
				timeout={windowAnimDuration * 1000}
				in={show}
				onEnter={(node) => {
					const { minimized, windowed, maximized } = this.difStatesCSS
					if (isMobile) TweenMax.fromTo(node, windowAnimDuration, { ...minimized }, { ...maximized })
					else TweenMax.fromTo(node, windowAnimDuration, { ...minimized }, { ...windowed })
				}}
				onEntered={this.enableDrag}
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
					theme={isFocused ? themes.blue : themes.dark}
				>
					<TitleBar
						id={`title-bar-${id}`}
						isFocused={isFocused}
						isMobile={isMobile}
						onDoubleClick={this.toggleMaximize}
						onTouchEnd={(e) => {
							// 'onDoubleClick' doesn't work w/ touch events even though the normal 'onClick' does?
							if (isDoubleTouch(e)) this.toggleMaximize()
						}}
						theme={isFocused ? themes.blue : themes.dark}
					>
						<div>
							{title}#{id} - zIndex: {zIndex}
						</div>
						<div style={{ display: 'flex', marginLeft: 'auto' }}>
							<Button theme={themes.light} onClick={() => this.minimize()} svg={svgMinimize} />
							<Button
								theme={themes.light}
								onClick={this.toggleMaximize}
								svg={isMaximized ? svgFullscreenExit : svgFullscreen}
							/>
							<Button theme={themes.light} onClick={() => closeApp(id)} svg={svgClose} />
						</div>
					</TitleBar>
					<Content onClick={() => focusApp(id)}>
						<WindowSizeContext.Provider value={this.state.isMobileSizedWindow}>
							{this.props.children}
						</WindowSizeContext.Provider>
					</Content>
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
