import * as React from "react"
import { gsap, Draggable } from "gsap/all"
import styled, { css } from "styled-components/macro"
import { Transition } from "react-transition-group"
import { throttle } from "throttle-debounce"
import { rgba } from "polished"

import { ReactComponent as CloseSVG } from "../../shared/assets/icons/close.svg"
import { ReactComponent as MinimizeSVG } from "../../shared/assets/icons/minimize.svg"
import { ReactComponent as FullscreenExitSVG } from "../../shared/assets/icons/fullscreen-exit.svg"
import { ReactComponent as FullscreenSVG } from "../../shared/assets/icons/fullscreen.svg"
import {
	getRect,
	isDoubleTouch,
	opac,
	ls,
	Styles,
	flags,
	mediaBreakpoints,
	Contexts,
} from "../../shared/shared"
import Button from "../ui/Button"

gsap.registerPlugin(Draggable)

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div`
	position: absolute;
	display: flex;
	flex-direction: column;
	max-width: 100vw;
	max-height: 100vh;
	opacity: 0;
	backface-visibility: hidden;
	${({ minWindowCSS, zIndex, isFocused, isMobileSite, isMaximized, theme }) => css`
		z-index: ${zIndex};
			${
				!isMobileSite &&
				css`
					min-height: ${minWindowCSS.height}px;
					min-width: ${minWindowCSS.width}px;
				`
			}
		border: ${
			isMaximized
				? "none"
				: isFocused
				? `1px solid ${theme.accent}`
				: `1px solid ${opac(0.5, theme.accent)}`
		};
		filter: ${isFocused && `drop-shadow(0 1px 12px ${opac(0.2, theme.accent)})`} blur(0);
	`}
`

const TitleBar = styled.div`
	flex: 0 0 auto;
	padding-left: 0.5em;
	font-weight: 500;
	align-items: center;
	height: var(--nav-height);
	${({ isMobileSite, theme, isFocused }) => {
		const bgColor = isFocused ? theme.color : theme.altBackground
		return css`
			color: ${theme.contrast};
			border-bottom: 1px solid ${theme.accent};
			display: ${isMobileSite ? "none" : "flex"};
			background: ${rgba(bgColor, 0.9)};
		`
	}}
`

const Content = styled.div`
	flex: 1 1;
	position: relative;
	overflow: hidden;
	${({ theme }) => css`
		> div:last-child {
			overflow-x: hidden;
			overflow-y: auto;
			position: absolute;
			top: 0;
			left: 0;
			height: 100%;
			width: 100%;
			background: ${theme.background};
			color: ${theme.contrast};
		}
	`}
`

// Change these to control the sizes for the interactive parts of the component.
const sideSize = "0.5em"
const sideOffset = `calc(${sideSize} / 2 * -1)`
const Side = styled.div.attrs(({ position }) => ({
	style: {
		[position]: sideOffset,
	},
}))`
	position: absolute;
	${({ position }) =>
		["top", "bottom"].includes(position)
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

		const { top, left, width, height } = getRect("window-wireframe")
		this.data = {
			closedProperly: true,
			css: {
				minimized: {
					scale: 0,
					ease: "back.in(1.75)",
					duration: 0.35,
				},
				windowed: {
					top,
					left,
					width,
					height,
					scale: 1,
					x: 0,
					y: 0,
					opacity: 1,
					ease: "elastic.out(1.1, 0.5)",
					duration: 1,
				},
				maximized: {
					top: 0,
					left: 0,
					width: "100%",
					height: "100%",
					scale: 1,
					x: 0,
					y: 0,
					opacity: 1,
					ease: "bounce.out",
					duration: 0.75,
				},
				current: {
					width,
					height,
				},
			},
			...(ls.get(`${props.title}-window-data`) || {}),
		}
		this.state = {
			isMinimized: true,
			isWindowed: false,
			isMaximized: props.isMobileSite,
			isMobileWindow: props.isMobileSite,
			...(ls.get(`${props.title}-window-state`) || {}),
		}
	}

	componentDidMount() {
		this.genDraggables()
		this.enterAnim()
		window.addEventListener("resize", this.handleViewportResizeThrottled)
		window.addEventListener("beforeunload", this.save)
		this.handleViewportResize()
	}

	componentWillUnmount() {
		this.handleViewportResizeThrottled.cancel()
		window.removeEventListener("resize", this.handleViewportResizeThrottled)
		window.removeEventListener("beforeunload", this.save)
		if (this.dragInstances) this.dragInstances.forEach((i) => i[0].kill())
		this.handleExit()
	}

	componentDidUpdate(prevProps, prevState) {
		const { isMobileSite, isFocused } = this.props
		if (prevProps.isMobileSite !== isMobileSite) {
			this.dragInstances.forEach((i) => i[0].enabled(!isMobileSite))
			if (isMobileSite) {
				if (isFocused && !this.state.isMaximized) this.maximize()
				if (!this.state.isMobileWindow) this.setState({ isMobileWindow: true })
			}
		}
		this.handleViewportResizeThrottled()
	}

	genDraggables = () => {
		const { id, focusApp, minWindowCSS, isMobileSite } = this.props
		const wdowEle = this.rootRef.current
		const wdow = this

		this.draggableWindow = Draggable.create(wdowEle, {
			type: "x,y",
			cursor: "grab",
			activeCursor: "grabbing",
			bounds: "#allowedDragArea",
			edgeResistance: 0.5,
			trigger: `#title-bar-${id}`,
			zIndexBoost: false,
			force3D: !flags.isChrome,
			onPress: () => focusApp(id),
			onRelease: () => {
				wdow.draggableWindow[0].update(true)
				wdow.setLastWindowedCSS()
				wdow.preventSubpixelValues()
			},
			allowContextMenu: true,
		})

		function genResizeDraggable(vars) {
			const parent = document.getElementById("allowedDragArea")
			const nextEle = document.createElement("div")
			nextEle.style.position = "absolute"
			parent.appendChild(nextEle)
			return Draggable.create(nextEle, {
				...vars,
				type: "x,y",
				onPress: () => {
					focusApp(id)
					wdow.draggableWindow[0].disable()
				},
				onRelease: () => {
					wdow.draggableWindow[0].enable()
					wdow.setLastWindowedCSS()
					wdow.preventSubpixelValues()
				},
				onDrag: function () {
					vars.onDrag(this, wdow.data.css.windowed)
					wdow.data.css.current.width = wdow.data.css.windowed.width
					wdow.data.css.current.height = wdow.data.css.windowed.height
					wdow.handleViewportResizeThrottled()
				},
				allowContextMenu: true,
			})
		}

		// GSAP quick setters have better performance than the traditional gsap.set()
		const qsWidth = gsap.quickSetter(wdowEle, "width", "px")
		const qsHeight = gsap.quickSetter(wdowEle, "height", "px")
		const qs = gsap.quickSetter(wdowEle, "css")

		this.dragInstances = [
			this.draggableWindow,
			genResizeDraggable({
				trigger: `#side-top-${id}, #corner-nw-${id}, #corner-ne-${id}`,
				cursor: "n-resize",
				onDrag: function (drag, wdowCSS) {
					const nextHeightBelowMin = wdowCSS.height - drag.deltaY < minWindowCSS.height
					const nextHeightAboveMax = wdowCSS.height - drag.deltaY > drag.maxY

					if (nextHeightBelowMin) drag.deltaY = wdowCSS.height - minWindowCSS.height
					else if (nextHeightAboveMax) drag.deltaY = drag.maxY - wdowCSS.height
					wdowCSS.height -= drag.deltaY

					qsHeight(wdowCSS.height)
					qs({ y: `+=${drag.deltaY}` })
				},
			}),
			genResizeDraggable({
				trigger: `#side-right-${id}, #corner-ne-${id}, #corner-se-${id}`,
				cursor: "e-resize",
				onDrag: function (drag, wdowCSS) {
					const nextWidthBelowMin = wdowCSS.width + drag.deltaX < minWindowCSS.width
					const nextWidthAboveMax = wdowCSS.width + drag.deltaX > drag.maxX

					if (nextWidthBelowMin) wdowCSS.width = minWindowCSS.width
					else if (nextWidthAboveMax) wdowCSS.width = drag.maxX
					else wdowCSS.width += drag.deltaX

					qsWidth(wdowCSS.width)
				},
			}),
			genResizeDraggable({
				trigger: `#side-bottom-${id}, #corner-sw-${id}, #corner-se-${id}`,
				cursor: "s-resize",
				onDrag: function (drag, wdowCSS) {
					const nextHeightBelowMin = wdowCSS.height + drag.deltaY < minWindowCSS.height
					const nextHeightAboveMax = wdowCSS.height + drag.deltaY > drag.maxY

					if (nextHeightBelowMin) wdowCSS.height = minWindowCSS.height
					else if (nextHeightAboveMax) wdowCSS.height = drag.maxY
					else wdowCSS.height += drag.deltaY

					qsHeight(wdowCSS.height)
				},
			}),
			genResizeDraggable({
				trigger: `#side-left-${id}, #corner-nw-${id}, #corner-sw-${id}`,
				cursor: "w-resize",
				onDrag: function (drag, wdowCSS) {
					const nextWidthBelowMin = wdowCSS.width - drag.deltaX < minWindowCSS.width
					const nextWidthAboveMax = wdowCSS.width - drag.deltaX > drag.maxX

					if (nextWidthBelowMin) drag.deltaX = wdowCSS.width - minWindowCSS.width
					else if (nextWidthAboveMax) drag.deltaX = wdowCSS.width - drag.maxX
					wdowCSS.width -= drag.deltaX

					qsWidth(wdowCSS.width)
					qs({ x: `+=${drag.deltaX}` })
				},
			}),
		]
		if (isMobileSite) this.dragInstances.forEach((i) => i[0].disable())
	}

	save = () => {
		ls.set(`${this.props.title}-window-state`, this.state)
		ls.set(`${this.props.title}-window-data`, this.data)
	}

	handleExit = () => {
		this.data.closedProperly = true
		this.save()
	}

	handleViewportResize = () => {
		const width = this.data.css.current.width
		const { isMobileWindow } = this.state
		if (!isMobileWindow && width < mediaBreakpoints.desktop) {
			this.setState({ isMobileWindow: true })
		} else if (isMobileWindow && width >= mediaBreakpoints.desktop) {
			this.setState({ isMobileWindow: false })
		}
		if (this.draggableWindow) this.draggableWindow[0].update(true)
	}

	minimize = (extraVars = {}) => {
		if (this.state.isMinimized) return

		this.animate({ ...this.data.css.minimized, ...extraVars })
		this.setState({ isMinimized: true, isWindowed: false })
		this.props.focusBelowApp(this.props.zIndex)
	}

	toggleMinimize = () => {
		if (this.state.isMinimized) this.restore()
		else if (this.props.isFocused) this.minimize()
		else this.props.focusApp(this.props.id)
	}

	restore = (extraVars = {}) => {
		const { isMinimized, isWindowed, isMaximized } = this.state
		if (isWindowed) return
		if ((isMinimized && isMaximized) || (this.props.isMobileSite && isMinimized)) {
			this.maximize()
			return
		}

		if (!this.props.isFocused) this.props.focusApp(this.props.id)
		this.animate({ ...this.data.css.windowed, ...extraVars })
		this.setState({ isMinimized: false, isWindowed: true, isMaximized: false })
	}

	maximize = (extraVars = {}) => {
		if (!this.props.isFocused) this.props.focusApp(this.props.id)
		this.animate({ ...this.data.css.maximized, ...extraVars })
		this.setState({ isMinimized: false, isWindowed: false, isMaximized: true })
	}

	toggleMaximize = () => {
		if (this.state.isMaximized) this.restore()
		else this.maximize()
	}

	// Chrome bug causes children to become blurry on parent transforms that end in subpixel values.
	// Have to round all values at the end of animations/drags.
	preventSubpixelValues = () => {
		if (!this.state.isWindowed) return

		const wdowStyles = new Styles(this.rootRef.current)
		const matrix = wdowStyles.get("transform")
		const top = wdowStyles.get("top")
		const left = wdowStyles.get("left")

		const transform = { x: Math.round(matrix[matrix.length - 2]), y: Math.round(matrix[matrix.length - 1]) }
		const { width, height } = getRect(this.rootRef.current)

		const roundedVars = {
			...transform,
			top: Math.round(top),
			left: Math.round(left),
			width: Math.round(width),
			height: Math.round(height),
		}
		this.data.css.windowed = {
			...this.data.css.windowed,
			...roundedVars,
		}
		this.data.css.current = {
			...this.data.css.current,
			...roundedVars,
		}

		gsap.set(this.rootRef.current, roundedVars)
	}

	animate = (tweenVars) => {
		this.setLastWindowedCSS()
		// if (!this.props.isFocused) this.props.focusApp(this.props.id)
		const wdow = this
		gsap.to(wdow.rootRef.current, {
			...tweenVars,
			onStart: () => {
				wdow.draggableWindow[0].disable()
				wdow.dragInstances.forEach((i) => i[0].disable())
			},
			onComplete: () => {
				// Prevent error if scale of element is 0.
				if (!wdow.state.isMinimized) wdow.draggableWindow[0].update(true)
				wdow.draggableWindow[0].enable()
				wdow.dragInstances.forEach((i) => i[0].enable())
				wdow.preventSubpixelValues()
			},
			onUpdate: function () {
				wdow.data.css.current.width = this._targets[0].offsetWidth
				wdow.data.css.current.height = this._targets[0].offsetHeight
				wdow.handleViewportResizeThrottled()
			},
		})
	}

	setLastWindowedCSS = () => {
		if (!this.state.isWindowed || gsap.isTweening(this.rootRef.current)) return

		this.draggableWindow[0].update(true)
		const wdowStyles = new Styles(this.rootRef.current)
		this.data.css.windowed = {
			...this.data.css.windowed,
			top: wdowStyles.get("top"),
			left: wdowStyles.get("left"),
			x: this.draggableWindow[0].x,
			y: this.draggableWindow[0].y,
		}
	}

	enterAnim = () => {
		const wdow = this
		const { css } = this.data
		const { isMinimized, isMaximized } = this.state

		if (this.data.closedProperly) {
			const curStateOptions = isMaximized ? css.maximized : css.windowed
			const animTime = css.minimized.duration + curStateOptions.duration
			gsap.set(wdow.rootRef.current, { ...css.minimized })
			wdow.restore({ duration: animTime })
		} else {
			if (isMinimized) gsap.set(wdow.rootRef.current, { ...css.minimized })
			else gsap.set(wdow.rootRef.current, { ...(isMaximized ? css.maximized : css.windowed) })
		}
		this.data.closedProperly = false
	}

	render() {
		const { id, title, isMobileSite, isFocused, zIndex, minWindowCSS, in: show, ...props } = this.props
		const { isMaximized } = this.state
		const { closeApp, focusApp } = this.props
		return (
			<Transition
				{...props}
				in={show}
				timeout={{ appear: 50, enter: 50, exit: this.data.css.minimized.duration * 1000 }}
				onExit={this.minimize}
				mountOnEnter
				unmountOnExit
				appear
			>
				<Root
					id={`window-${id}`}
					ref={this.rootRef}
					isMaximized={isMaximized}
					isFocused={isFocused}
					isMobileSite={isMobileSite}
					minWindowCSS={minWindowCSS}
					zIndex={zIndex}
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
					>
						<div>{title}</div>
						<div style={{ display: "flex", marginLeft: "auto" }}>
							<Button onClick={() => this.minimize()} svg={MinimizeSVG} className="check-contrast" />
							<Button
								onClick={this.toggleMaximize}
								svg={isMaximized ? FullscreenExitSVG : FullscreenSVG}
								className="check-contrast"
							/>
							<Button color="red" onClick={() => closeApp(id)} svg={CloseSVG} />
						</div>
					</TitleBar>
					<Content onClick={() => focusApp(id)}>
						<Contexts.IsMobileWindow.Provider value={this.state.isMobileWindow}>
							{this.props.children}
						</Contexts.IsMobileWindow.Provider>
					</Content>
					<Side position="top" id={`side-top-${id}`} />
					<Side position="right" id={`side-right-${id}`} />
					<Side position="bottom" id={`side-bottom-${id}`} />
					<Side position="left" id={`side-left-${id}`} />
					<CornerNW id={`corner-nw-${id}`} />
					<CornerNE id={`corner-ne-${id}`} />
					<CornerSE id={`corner-se-${id}`} />
					<CornerSW id={`corner-sw-${id}`} />
				</Root>
			</Transition>
		)
	}
}
