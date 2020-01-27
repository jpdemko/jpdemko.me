import React from 'react'
import { gsap, Draggable } from 'gsap/all'
import styled, { css } from 'styled-components/macro'
import { Transition } from 'react-transition-group'
import { throttle } from 'throttle-debounce'

import { ReactComponent as CloseSVG } from '../../shared/assets/material-icons/close.svg'
import { ReactComponent as MinimizeSVG } from '../../shared/assets/material-icons/minimize.svg'
import { ReactComponent as FullscreenExitSVG } from '../../shared/assets/material-icons/fullscreen-exit.svg'
import { ReactComponent as FullscreenSVG } from '../../shared/assets/material-icons/fullscreen.svg'
import {
	getStyleProperty,
	getRect,
	isDoubleTouch,
	opac,
	themes,
	mediaBreakpoints,
	Contexts,
} from '../../shared/shared'
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
			${!isMobileSite &&
				css`
					min-height: ${minWindowCSS.height}px;
					min-width: ${minWindowCSS.width}px;
				`}
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
		color: ${theme.contrastColor};
		display: ${isMobileSite ? 'none' : 'flex'};
		background-image: ${theme.gradient};
	`}
`

const Content = styled.div`
	flex: 1 1 auto;
	position: relative;
	overflow: hidden;
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
		this.handleViewportResizeThrottled = throttle(200, this.handleViewportResize)

		this.state = { isMobileWindow: props.isMobileSite, isMaximized: props.isMobileSite }

		this.animStates = {
			isMinimized: false,
			isMaximized: props.isMobileSite,
			isWindowed: !props.isMobileSite,
		}
		const wireframe = getRect('window-wireframe')
		this.animStatesCSS = {
			minimized: {
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
			sharedSettings: {
				// ease: 'elastic.inOut(1.2, 0.4)',
				// duration: 1,
				ease: 'power4.inOut',
				duration: 0.5,
			},
		}
	}

	componentDidMount() {
		const { id, focusApp, minWindowCSS, isMobileSite } = this.props
		const windowElement = this.rootRef.current

		// Get all the dimensions needed for resize calculations.
		const { width, height } = getRect('window-wireframe')
		this.windowRect = { width, height }
		this.handleViewportResize()

		// Prevent 'this' conflicts later.
		const wdow = this

		this.draggableWindow = Draggable.create(windowElement, {
			type: 'x,y',
			cursor: 'grab',
			activeCursor: 'grabbing',
			bounds: '#allowedDragArea',
			edgeResistance: 0.5,
			trigger: `#title-bar-${id}`,
			zIndexBoost: false,
			onPress: () => focusApp(id),
			allowContextMenu: true,
		})

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
					wdow.recalcDragAreaRect()
					wdow.draggableWindow[0].disable()
				},
				onRelease: () => {
					wdow.draggableWindow[0].enable()
					wdow.draggableWindow[0].applyBounds()
				},
				allowContextMenu: true,
			})
		}

		this.dragInstances = [
			this.draggableWindow,
			genResizeDraggable({
				trigger: `#side-top-${id}, #corner-nw-${id}, #corner-ne-${id}`,
				cursor: 'n-resize', // ^-negative-^   v-positive-v
				onDrag: function() {
					const nextHeightBelowMin = wdow.windowRect.height - this.deltaY < minWindowCSS.height
					const nextHeightAboveMax = wdow.windowRect.height - this.deltaY > wdow.dragAreaRect.height

					if (nextHeightBelowMin) this.deltaY = wdow.windowRect.height - minWindowCSS.height
					else if (nextHeightAboveMax) this.deltaY = wdow.dragAreaRect.height - wdow.windowRect.height
					wdow.windowRect.height = wdow.windowRect.height - this.deltaY

					wdow.handleViewportResizeThrottled()
					gsap.set(windowElement, {
						height: wdow.windowRect.height,
						y: `+=${this.deltaY}`,
					})
				},
			}),
			genResizeDraggable({
				trigger: `#side-right-${id}, #corner-ne-${id}, #corner-se-${id}`,
				cursor: 'e-resize', // negative <--   ---> positive
				onDrag: function() {
					const nextWidthBelowMin = wdow.windowRect.width + this.deltaX < minWindowCSS.width
					const nextWidthAboveMax = wdow.windowRect.width + this.deltaX > wdow.dragAreaRect.width

					if (nextWidthBelowMin) wdow.windowRect.width = minWindowCSS.width
					else if (nextWidthAboveMax) wdow.windowRect.width = wdow.dragAreaRect.width
					else wdow.windowRect.width += this.deltaX

					wdow.handleViewportResizeThrottled()
					gsap.set(windowElement, { width: wdow.windowRect.width })
				},
			}),
			genResizeDraggable({
				trigger: `#side-bottom-${id}, #corner-sw-${id}, #corner-se-${id}`,
				cursor: 's-resize', // ^-negative-^   v-positive-v
				onDrag: function() {
					const nextHeightBelowMin = wdow.windowRect.height + this.deltaY < minWindowCSS.height
					const nextHeightAboveMax = wdow.windowRect.height + this.deltaY > wdow.dragAreaRect.height

					if (nextHeightBelowMin) wdow.windowRect.height = minWindowCSS.height
					else if (nextHeightAboveMax) wdow.windowRect.height = wdow.dragAreaRect.height
					else wdow.windowRect.height += this.deltaY

					wdow.handleViewportResizeThrottled()
					gsap.set(windowElement, { height: wdow.windowRect.height })
				},
			}),
			genResizeDraggable({
				trigger: `#side-left-${id}, #corner-nw-${id}, #corner-sw-${id}`,
				cursor: 'w-resize', // negative <--   ---> positive
				onDrag: function() {
					const nextWidthBelowMin = wdow.windowRect.width - this.deltaX < minWindowCSS.width
					const nextWidthAboveMax = wdow.windowRect.width - this.deltaX > wdow.dragAreaRect.width

					if (nextWidthBelowMin) this.deltaX = wdow.windowRect.width - minWindowCSS.width
					else if (nextWidthAboveMax) this.deltaX = wdow.windowRect.width - wdow.dragAreaRect.width
					wdow.windowRect.width = wdow.windowRect.width - this.deltaX

					wdow.handleViewportResizeThrottled()
					gsap.set(windowElement, {
						width: wdow.windowRect.width,
						x: `+=${this.deltaX}`,
					})
				},
			}),
		]
		if (isMobileSite) this.dragInstances.forEach((i) => i[0].disable())
		window.addEventListener('resize', this.handleViewportResizeThrottled)
	}

	componentWillUnmount() {
		this.dragInstances.forEach((i) => i[0].kill())
		this.handleViewportResizeThrottled.cancel()
		window.removeEventListener('resize', this.handleViewportResizeThrottled)
	}

	componentDidUpdate(prevProps, prevState) {
		const { isMobileSite, isFocused } = this.props
		if (prevProps.isMobileSite !== isMobileSite) {
			this.dragInstances.forEach((i) => i[0].enabled(!isMobileSite))
			if (isMobileSite) {
				if (isFocused && !this.animStates.isMaximized) this.maximize()
				else if (!this.animStates.isMinimized && !isFocused) this.minimize(['skipFocusBelowApp'])
				if (!this.state.isMobileWindow) this.setState({ isMobileWindow: true })
			}
		}
		if (!prevProps.isFocused && isFocused && this.animStates.isMinimized) {
			this.restore()
		}
	}

	recalcDragAreaRect = () => {
		const { width, height } = getRect('allowedDragArea')
		const nextDragAreaRect = { width, height }
		if (JSON.stringify(this.dragAreaRect ?? {}) !== JSON.stringify(nextDragAreaRect)) {
			this.dragAreaRect = nextDragAreaRect
		}
	}

	handleViewportResize = () => {
		this.recalcDragAreaRect()
		if (!this.state.isMobileWindow && this.windowRect.width < mediaBreakpoints.desktop) {
			this.setState({ isMobileWindow: true })
		} else if (this.state.isMobileWindow && this.windowRect.width >= mediaBreakpoints.desktop) {
			this.setState({ isMobileWindow: false })
		}
	}

	/**
	 * Minimizes the amount of renders compared to if we just used setState().
	 * Child components only care about if the <Window /> is maximized, not the other anim. states.
	 */
	setAnimStates = (nextState) => {
		this.animStates = {
			...this.animStates,
			...nextState,
		}
		if (nextState.isMaximized !== 'undefined') this.setState(nextState)
	}

	minimize = (options = []) => {
		if (this.animStates.isMinimized) return

		const { isFocused, focusBelowApp, zIndex } = this.props
		this.animate(this.animStatesCSS.minimized, [...options, 'skipFocusApp'])
		this.setAnimStates({ isMinimized: true, isWindowed: false })
		if (!options.includes('skipFocusBelowApp') && isFocused) focusBelowApp(zIndex)
	}

	toggleMinimize = () => {
		if (this.animStates.isMinimized) this.restore()
		else if (this.props.isFocused) this.minimize()
		else this.props.focusApp(this.props.id)
	}

	restore = (options) => {
		const { isMinimized, isWindowed, isMaximized } = this.animStates
		if (isWindowed) return
		if (isMinimized && isMaximized) {
			this.maximize(options)
			return
		}

		this.animate(this.animStatesCSS.windowed, options)
		this.setAnimStates({ isMinimized: false, isWindowed: true, isMaximized: false })
	}

	maximize = (options) => {
		this.animate(this.animStatesCSS.maximized, options)
		this.setAnimStates({ isMinimized: false, isWindowed: false, isMaximized: true })
	}

	toggleMaximize = () => {
		if (this.animStates.isMaximized) this.restore()
		else this.maximize()
	}

	animate = (tweenVars, options = []) => {
		if (!options.includes('skipSetLastWindowedCSS')) this.setLastWindowedCSS()
		if (!options.includes('skipFocusApp')) this.props.focusApp(this.props.id)

		// Prevent 'this' conflicts later.
		const wdow = this

		// Clone vars so GSAP doesn't alter original...
		gsap.to(this.rootRef.current, {
			...tweenVars,
			...wdow.animStatesCSS.sharedSettings,
			onComplete: () => {
				// Prevent error if scale of element is 0.
				if (!this.animStates.isMinimized) this.draggableWindow[0].applyBounds()
			},
			onUpdate: function() {
				wdow.windowRect.width = this._targets[0].offsetWidth
				wdow.windowRect.height = this._targets[0].offsetHeight
				wdow.handleViewportResizeThrottled()
			},
		})
	}

	setLastWindowedCSS = () => {
		if (!this.animStates.isWindowed || gsap.isTweening(this.rootRef.current)) return

		this.draggableWindow[0].update()
		this.animStatesCSS.windowed = {
			top: getStyleProperty(this.rootRef.current, 'top', { parse: true })?.[0],
			left: getStyleProperty(this.rootRef.current, 'left', { parse: true })?.[0],
			x: this.draggableWindow[0].x,
			y: this.draggableWindow[0].y,
			width: this.windowRect.width,
			height: this.windowRect.height,
			scale: 1,
		}
	}

	enterAnim = (node) => {
		const { minimized, windowed, maximized, sharedSettings } = this.animStatesCSS
		const { isMobileSite } = this.props
		gsap.fromTo(
			node,
			{ ...minimized },
			{
				...(isMobileSite ? maximized : windowed),
				...sharedSettings,
				duration: 0.8,
			},
		)
	}

	render() {
		const { id, title, isMobileSite, isFocused, zIndex, minWindowCSS, in: show, ...props } = this.props
		const { isMaximized } = this.state
		const { closeApp, focusApp } = this.props
		return (
			<Transition
				{...props}
				in={show}
				timeout={{
					appear: 100,
					enter: 800,
					exit: 400,
				}}
				onEnter={this.enterAnim}
				onExit={() => this.minimize()}
				unmountOnExit
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
						<Contexts.IsMobileWindow.Provider value={this.state.isMobileWindow}>
							{this.props.children}
						</Contexts.IsMobileWindow.Provider>
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
