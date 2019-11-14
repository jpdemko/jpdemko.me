import React from 'react'
import { gsap, Draggable } from 'gsap/all'
import styled, { css } from 'styled-components/macro'
import { Transition } from 'react-transition-group'
import { throttle, debounce } from 'throttle-debounce'

import { ReactComponent as CloseSVG } from '../../shared/assets/material-icons/close.svg'
import { ReactComponent as MinimizeSVG } from '../../shared/assets/material-icons/minimize.svg'
import { ReactComponent as FullscreenExitSVG } from '../../shared/assets/material-icons/fullscreen-exit.svg'
import { ReactComponent as FullscreenSVG } from '../../shared/assets/material-icons/fullscreen.svg'
import { getStyleProperty, getRect, isDoubleTouch, opac, themes, mediaBreakpoints } from '../../shared/shared'
import Contexts from '../../shared/contexts'
import Button from '../ui/Button'

gsap.registerPlugin(Draggable)

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div`
	position: absolute;
	display: flex;
	flex-direction: column;
	max-width: 100vw;
	max-height: 100vh;
	${({ minWindowCSS, zIndex, isFocused, isMobileSite, isMaximized, theme }) => css`
		z-index: ${zIndex};
		${
			'' /* ${!isMobileSite &&
			css`
				min-height: ${minWindowCSS.minHeight}px;
				min-width: ${minWindowCSS.minWidth}px;
			`} */
		}
		border: ${isMaximized ? 'none' : `1px solid ${theme.mixedColor}`};
		filter: ${isFocused ? `drop-shadow(0 1px 12px ${opac(0.3, theme.mixedColor)})` : 'none'};
	`}
`

const TitleBar = styled.div`
	flex: 0 0 auto;
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
	flex: 1 1 auto;
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
					top: 0;
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
				scale: 0,
			},
			windowed: {
				top: wireframe.top,
				left: wireframe.left,
				width: wireframe.width,
				height: wireframe.height,
				scale: 1,
				x: 0,
				y: 0,
			},
			maximized: {
				top: 0,
				left: 0,
				width: '100%',
				height: '100%',
				scale: 1,
				x: 0,
				y: 0,
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

		this.draggableWindow = Draggable.create(windowElement, {
			type: 'x,y',
			cursor: 'grab',
			activeCursor: 'grabbing',
			bounds: '#display',
			edgeResistance: 0.5,
			trigger: `#title-bar-${id}`,
			zIndexBoost: false,
			onPress: () => focusApp(id),
			allowContextMenu: true,
		})

		const draggableWindow = this.draggableWindow
		const genResizeDraggable = (vars) => {
			const parent = document.getElementById('allowedDragArea')
			const nextEle = document.createElement('div')
			nextEle.style.position = 'absolute'
			parent.appendChild(nextEle)
			return Draggable.create(nextEle, {
				...vars,
				type: 'x,y',
				onPress: () => {
					focusApp(id)
					draggableWindow[0].disable()
				},
				onRelease: () => {
					draggableWindow[0].enable()
					checkMediaSize()
					syncPosition()
				},
				allowContextMenu: true,
			})
		}

		this.dragInstances = [
			this.draggableWindow,
			genResizeDraggable({
				trigger: `#side-top-${id}, #corner-nw-${id}, #corner-ne-${id}`,
				cursor: 'n-resize',
				onDrag: function() {
					const preventLowering = windowRect.height <= minWindowCSS.minHeight && this.deltaY > 0
					const deltaY = preventLowering ? 0 : this.deltaY
					windowRect.height -= deltaY
					checkMediaSizeThrottled()
					gsap.set(windowElement, {
						height: windowRect.height,
						y: `+=${deltaY}`,
					})
				},
			}),
			genResizeDraggable({
				trigger: `#side-right-${id}, #corner-ne-${id}, #corner-se-${id}`,
				cursor: 'e-resize',
				onDrag: function() {
					const preventLowering = windowRect.width <= minWindowCSS.minWidth && this.deltaX < 0
					const deltaX = preventLowering ? 0 : this.deltaX
					windowRect.width += deltaX
					checkMediaSizeThrottled()
					gsap.set(windowElement, { width: windowRect.width })
				},
			}),
			genResizeDraggable({
				trigger: `#side-bottom-${id}, #corner-sw-${id}, #corner-se-${id}`,
				cursor: 's-resize',
				onDrag: function() {
					const preventLowering = windowRect.height <= minWindowCSS.minHeight && this.deltaY < 0
					const deltaY = preventLowering ? 0 : this.deltaY
					windowRect.height += deltaY
					checkMediaSizeThrottled()
					gsap.set(windowElement, { height: windowRect.height })
				},
			}),
			genResizeDraggable({
				trigger: `#side-left-${id}, #corner-nw-${id}, #corner-sw-${id}`,
				cursor: 'w-resize',
				onDrag: function() {
					const preventLowering = windowRect.width <= minWindowCSS.minWidth && this.deltaX > 0
					const deltaX = preventLowering ? 0 : this.deltaX
					windowRect.width -= deltaX
					checkMediaSizeThrottled()
					gsap.set(windowElement, { width: windowRect.width, x: `+=${deltaX}` })
				},
			}),
		]
		if (isMobileSite) this.dragInstances.forEach((i) => i[0].disable())
		window.addEventListener('resize', this.handleResizeDebounced)
	}

	componentWillUnmount() {
		this.dragInstances.forEach((i) => i[0].kill())
		window.removeEventListener('resize', this.handleResizeDebounced)
	}

	componentDidUpdate(prevProps, prevState) {
		if (prevProps.isMobileSite !== this.props.isMobileSite) {
			this.dragInstances.forEach((i) => i[0].enabled(!this.props.isMobileSite))
		}
		const { isMaximized, isMinimized, isWindowed } = this.state
		if (isWindowed && (isMaximized || isMinimized)) this.setState({ isWindowed: false })
		else if (!isWindowed && !isMaximized && !isMinimized) this.setState({ isWindowed: true })
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
		this.draggableWindow[0].update(true)
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
		// Clone vars so GSAP doesn't alter original...
		gsap.to(this.rootRef.current, {
			...tweenVars,
			duration: 0.4,
			onComplete: () => {
				checkMediaSize()
			},
			onUpdate: function() {
				windowRect.width = this._targets[0].offsetWidth
				windowRect.height = this._targets[0].offsetHeight
				checkMediaSizeThrottled()
			},
		})
	}

	setLastWindowedCSS = () => {
		if (!this.state.isWindowed || gsap.isTweening(this.rootRef.current)) return
		this.syncPosition()

		const { width, height } = this.rootRef.current.getBoundingClientRect()
		this.difStatesCSS.windowed = {
			top: getStyleProperty(this.rootRef.current, 'top', true),
			left: getStyleProperty(this.rootRef.current, 'left', true),
			x: this.draggableWindow[0].x,
			y: this.draggableWindow[0].y,
			width,
			height,
			scale: 1,
		}
	}

	render() {
		const { id, title, isMobileSite, isFocused, zIndex, minWindowCSS, in: show } = this.props
		const { closeApp, focusApp } = this.props
		const { isMaximized } = this.state
		return (
			<Transition
				mountOnEnter
				unmountOnExit
				in={show}
				timeout={{
					appear: 100,
					enter: 800,
					exit: 400,
				}}
				onEnter={(node) => {
					const { minimized, windowed, maximized } = this.difStatesCSS
					gsap.fromTo(node, { ...minimized }, { ...(isMobileSite ? maximized : windowed), duration: 0.8 })
				}}
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
						<div>{title}</div>
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
