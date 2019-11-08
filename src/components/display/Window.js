import React from 'react'
import { TweenMax, Draggable } from 'gsap/all'
import styled, { css } from 'styled-components/macro'
import { Transition } from 'react-transition-group'
import { throttle, debounce } from 'throttle-debounce'

import { ReactComponent as CloseSVG } from '../../shared/assets/material-icons/close.svg'
import { ReactComponent as MinimizeSVG } from '../../shared/assets/material-icons/minimize.svg'
import { ReactComponent as FullscreenExitSVG } from '../../shared/assets/material-icons/fullscreen-exit.svg'
import { ReactComponent as FullscreenSVG } from '../../shared/assets/material-icons/fullscreen.svg'
import {
	getStyleProperty,
	getRect,
	isDoubleTouch,
	opac,
	flags,
	themes,
	mediaBreakpoints,
} from '../../shared/shared'
import Contexts from '../../shared/contexts'
import Button from '../ui/Button'

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div`
	position: absolute;
	display: flex;
	flex-direction: column;
	max-width: 100vw;
	max-height: 100vh;
	${({ minWindowCSS, zIndex, isFocused, isMobileSite, isMaximized, theme }) => css`
		z-index: ${zIndex};
		${!isMobileSite &&
			css`
				min-height: ${minWindowCSS.minHeight}px;
				min-width: ${minWindowCSS.minWidth}px;
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
	${({ isMobileSite, theme }) => css`
		color: ${theme.bgContrastColor};
		display: ${isMobileSite ? 'none' : 'flex'};
		background-image: ${theme.gradient};
	`}
`

const Content = styled.div`
	flex: 1;
	position: relative;
	overflow: hidden;
	> div {
		overflow-x: hidden;
		overflow-y: auto;
		height: 100%;
	}
`

// Change these to control the sizes for the interactive parts of the component.
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

/* -------------------------------- COMPONENT ------------------------------- */

export default class Window extends React.Component {
	constructor(props) {
		super(props)
		this.rootRef = React.createRef()
		this.checkMediaSizeThrottled = throttle(100, this.checkMediaSize)
		this.handleResizeDebounced = debounce(100, this.handleResize)

		this.state = {
			isMinimized: false,
			isMaximized: props.isMobileSite,
			isMobileWindow: props.isMobileSite,
		}

		const wireframe = getRect('window-wireframe')
		this.shortcutRect = getRect(`sc-${props.title}`)
		this.difStatesCSS = {
			minimized: {
				top: this.shortcutRect.top - wireframe.height / 2,
				left: this.shortcutRect.left - wireframe.width / 2,
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
		if (props.isMobileSite && !state.isMobileWindow) return { isMobileWindow: true }
		return null
	}

	componentDidMount() {
		const { id, focusApp, minWindowCSS, isMobileSite } = this.props
		const windowElement = this.rootRef.current

		// Grab rect of #window-wireframe which is used as opening location for all apps.
		let { width, height } = getRect('window-wireframe')
		// Interactable sides/corners use these values to prevent resizing <= min CSS values.
		this.windowRect = { width, height }
		this.checkMediaSize()
		// Prevent 'this' conflicts later.
		const windowRect = this.windowRect
		const checkMediaSize = this.checkMediaSize
		const checkMediaSizeThrottled = this.checkMediaSizeThrottled
		const syncPosition = this.syncPosition

		this.windowDraggable = new Draggable(windowElement, {
			activeCursor: 'grabbing',
			cursor: 'grab',
			force3D: !flags.isChrome,
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
				onRelease: () => {
					this.windowDraggable.enable()
					checkMediaSize()
					syncPosition()
				},
				allowContextMenu: true,
			})

		this.dragInstances = [
			this.windowDraggable,
			genResizeDraggable(document.createElement('div'), {
				trigger: `#side-top-${id}, #corner-nw-${id}, #corner-ne-${id}`,
				cursor: 'n-resize',
				onDrag: function() {
					const preventLowering = windowRect.height <= minWindowCSS.minHeight && this.deltaY > 0
					const deltaY = preventLowering ? 0 : this.deltaY
					windowRect.height -= deltaY
					checkMediaSizeThrottled()
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
					const preventLowering = windowRect.width <= minWindowCSS.minWidth && this.deltaX < 0
					const deltaX = preventLowering ? 0 : this.deltaX
					windowRect.width += deltaX
					checkMediaSizeThrottled()
					TweenMax.set(windowElement, { width: windowRect.width })
				},
			}),
			genResizeDraggable(document.createElement('div'), {
				trigger: `#side-bottom-${id}, #corner-sw-${id}, #corner-se-${id}`,
				cursor: 's-resize',
				onDrag: function() {
					const preventLowering = windowRect.height <= minWindowCSS.minHeight && this.deltaY < 0
					const deltaY = preventLowering ? 0 : this.deltaY
					windowRect.height += deltaY
					checkMediaSizeThrottled()
					TweenMax.set(windowElement, { height: windowRect.height })
				},
			}),
			genResizeDraggable(document.createElement('div'), {
				trigger: `#side-left-${id}, #corner-nw-${id}, #corner-sw-${id}`,
				cursor: 'w-resize',
				onDrag: function() {
					const preventLowering = windowRect.width <= minWindowCSS.minWidth && this.deltaX > 0
					const deltaX = preventLowering ? 0 : this.deltaX
					windowRect.width -= deltaX
					checkMediaSizeThrottled()
					TweenMax.set(windowElement, { width: windowRect.width, x: `+=${deltaX}` })
				},
			}),
		]
		if (isMobileSite) this.dragInstances.forEach((i) => i.disable())
		window.addEventListener('resize', this.handleResizeDebounced)
	}

	componentWillUnmount() {
		this.dragInstances.forEach((i) => i.kill())
		window.removeEventListener('resize', this.handleResizeDebounced)
	}

	componentDidUpdate(prevProps, prevState) {
		if (prevProps.isMobileSite !== this.props.isMobileSite) {
			this.dragInstances.forEach((i) => i.enabled(!this.props.isMobileSite))
		}
		const { isMaximized, isMinimized, isWindowed } = this.state
		if (isWindowed && (isMaximized || isMinimized)) this.setState({ isWindowed: false })
		else if (!isWindowed && (!isMaximized && !isMinimized)) this.setState({ isWindowed: true })
	}

	handleResize = () => {
		const { width, height } = getRect(`window-${this.props.id}`)
		this.windowRect = { width, height }
		this.checkMediaSize()
	}

	checkMediaSize = () => {
		const { isMobileWindow } = this.state
		const nextState = {}
		if (!isMobileWindow && this.windowRect.width < mediaBreakpoints.desktop) {
			nextState.isMobileWindow = true
		} else if (isMobileWindow && this.windowRect.width >= mediaBreakpoints.desktop) {
			nextState.isMobileWindow = false
		}
		this.setState(nextState)
	}

	syncPosition = () => {
		this.windowDraggable.update(true)
		const { width, height } = getRect(`window-${this.props.id}`)
		this.difStatesCSS.minimized = {
			...this.difStatesCSS.minimized,
			top: this.shortcutRect.top - height / 2,
			left: this.shortcutRect.left - width / 2,
			width,
			height,
		}
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
			if (this.props.isMobileSite) this.maximize()
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
		// Preventing 'this' conflict later.
		const windowRect = this.windowRect
		const checkMediaSize = this.checkMediaSize
		const checkMediaSizeThrottled = this.checkMediaSizeThrottled
		// const syncPosition = this.syncPosition
		// Clone vars so GSAP doesn't alter original...
		TweenMax.to(this.rootRef.current, 0.5, {
			...tweenVars,
			onComplete: () => {
				// syncPosition()
				checkMediaSize()
			},
			onUpdate: function() {
				windowRect.width = this.target.offsetWidth
				windowRect.height = this.target.offsetHeight
				checkMediaSizeThrottled()
			},
		})
	}

	setLastWindowedCSS = () => {
		if (!this.state.isWindowed || TweenMax.isTweening(this.rootRef.current)) return
		this.syncPosition()

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
		const { id, title, isMobileSite, isFocused, zIndex, minWindowCSS, in: show } = this.props
		const { closeApp, focusApp } = this.props
		const { isMaximized } = this.state
		const animDuration = 1
		return (
			<Transition
				unmountOnExit
				timeout={animDuration * 1000}
				in={show}
				onEnter={(node) => {
					const { minimized, windowed, maximized } = this.difStatesCSS
					if (isMobileSite) TweenMax.fromTo(node, animDuration, { ...minimized }, { ...maximized })
					else TweenMax.fromTo(node, animDuration, { ...minimized }, { ...windowed })
				}}
				onEntered={this.enableDrag}
				onExit={() => this.minimize()}
			>
				<Root
					id={`window-${id}`}
					ref={this.rootRef}
					isMaximized={isMaximized}
					isFocused={isFocused}
					isMobileSite={isMobileSite}
					minWindowCSS={minWindowCSS}
					zIndex={zIndex}
					theme={isFocused ? themes.blue : themes.dark}
				>
					<TitleBar
						id={`title-bar-${id}`}
						isFocused={isFocused}
						isMobileSite={isMobileSite}
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
							<Button theme={themes.light} onClick={() => this.minimize()} svg={MinimizeSVG} />
							<Button
								theme={themes.light}
								onClick={this.toggleMaximize}
								svg={isMaximized ? FullscreenExitSVG : FullscreenSVG}
							/>
							<Button theme={themes.light} onClick={() => closeApp(id)} svg={CloseSVG} />
						</div>
					</TitleBar>
					<Content onClick={() => focusApp(id)}>
						<Contexts.MobileWindow.Provider value={this.state.isMobileWindow}>
							<Contexts.LandscapeOrientation.Provider value={this.state.isLandscape}>
								{this.props.children}
							</Contexts.LandscapeOrientation.Provider>
						</Contexts.MobileWindow.Provider>
					</Content>
					<Side position='top' id={`side-top-${id}`} />
					<Side position='right' id={`side-right-${id}`} />
					<Side position='bottom' id={`side-bottom-${id}`} />
					<Side position='left' id={`side-left-${id}`} />
					<CornerNW id={`corner-nw-${id}`} />
					<CornerNE id={`corner-ne-${id}`} />
					<CornerSE id={`corner-se-${id}`} />
					<CornerSW id={`corner-sw-${id}`} />
				</Root>
			</Transition>
		)
	}
}
