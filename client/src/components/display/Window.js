import * as React from "react"
import { gsap, Draggable } from "gsap/all"
import styled, { css } from "styled-components/macro"
import { Transition } from "react-transition-group"
import throttle from "lodash/throttle"
import merge from "lodash/merge"
import { rgba } from "polished"

import { ReactComponent as CloseSVG } from "../../shared/assets/icons/close.svg"
import { ReactComponent as MinimizeSVG } from "../../shared/assets/icons/minimize.svg"
import { ReactComponent as FullscreenExitSVG } from "../../shared/assets/icons/fullscreen-exit.svg"
import { ReactComponent as FullscreenSVG } from "../../shared/assets/icons/fullscreen.svg"
import { ReactComponent as MenuSVG } from "../../shared/assets/icons/menu.svg"
import { getRect, isDoubleTouch, opac, ls, Styles, mediaBreakpoints, Contexts } from "../../shared/shared"
import Button from "../ui/Button"
import Drawer from "../ui/Drawer"
import Loading from "../ui/Loading"

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
		${!isMobileSite &&
		css`
			min-height: ${minWindowCSS.height}px;
			min-width: ${minWindowCSS.width}px;
		`}
		border: ${isMaximized
			? "none"
			: isFocused
			? `1px solid ${theme.accent}`
			: `1px solid ${opac(0.5, theme.accent)}`};
		filter: ${isFocused && `drop-shadow(0 1px 12px ${opac(0.2, theme.accent)})`} blur(0);
	`}
`

const TitleBar = styled.div`
	flex: 0 0 auto;
	padding: 1px;
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
		this.handleViewportResizeThrottled = throttle(this.handleViewportResize, 200)

		const { top, left, width, height } = getRect("window-wireframe")
		const prevData = ls.get(props.title) ?? {}
		const { window: loadedWdow } = prevData
		this.data = loadedWdow?.data ?? {
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
		}
		this.appDrawerContent = null
		this.state = merge(
			{
				context: {
					isMobileWindow: props.isMobileSite,
					setAppDrawerContent: this.setAppDrawerContent,
					setAppLoading: this.setAppLoading,
				},
				appLoading: false,
				appDrawerContent: null,
				appDrawerShown: false,
			},
			loadedWdow?.state ?? {}
		)
	}

	componentDidMount() {
		this.mounted = true
		this.genDraggables()
		this.enterAnim()
		window.addEventListener("resize", this.handleViewportResizeThrottled)
		window.addEventListener("beforeunload", this.save)
		this.handleViewportResizeThrottled()
		this.determineMainNavBurgerCB()
	}

	componentWillUnmount() {
		this.mounted = false
		this.handleExit()
		window.removeEventListener("resize", this.handleViewportResizeThrottled)
		window.removeEventListener("beforeunload", this.save)
		this.handleViewportResizeThrottled.cancel()
		if (this.dragInstances) this.dragInstances.forEach((i) => i[0].kill())
	}

	componentDidUpdate(prevProps, prevState) {
		const { isMinimized, isMaximized, isFocused } = this.props

		// Determine if any animations need to occur.
		if (prevProps.isMinimized !== isMinimized) {
			if (isMinimized) this.animMinimize()
			else {
				if (isMaximized) this.animMaximize()
				else this.animWindowed()
			}
		} else if (prevProps.isMaximized !== isMaximized) {
			if (isMaximized) this.animMaximize()
			else this.animWindowed()
		}

		// If focused and isMobileSite use 'setMainNavBurgerCB' to toggle this app's Drawer.
		const newDrawerContent = prevState.appDrawerContent === null && !!this.state.appDrawerContent
		if ((!prevProps.isFocused && isFocused) || newDrawerContent) {
			this.determineMainNavBurgerCB()
		}

		// Resize listener isn't sufficient for all cases if window instantly resizes
		this.handleViewportResizeThrottled()
	}

	determineMainNavBurgerCB = () => {
		if (this.props.isMobileSite && this.props.isFocused) {
			const cb = this.state.appDrawerContent ? this.toggleAppDrawerShown : null
			this.props.setMainNavBurgerCB(cb)
		}
	}

	toggleAppDrawerShown = () => {
		const { appDrawerShown } = this.state
		this.setState({ appDrawerShown: !appDrawerShown, appDrawerContent: this.appDrawerContent })
	}

	setAppDrawerContent = (appDrawerContent) => {
		this.appDrawerContent = appDrawerContent
		if (this.state.appDrawerShown || this.state.appDrawerContent === null) {
			this.setState({ appDrawerContent })
		}
	}

	setAppLoading = (bool) => {
		this.setState((prev) => ({
			appLoading: bool ?? !prev.appLoading,
		}))
	}

	genDraggables = () => {
		const { title, focusApp, minWindowCSS, isMobileSite } = this.props
		const wdowEle = this.rootRef.current
		const wdow = this

		this.draggableWindow = Draggable.create(wdowEle, {
			type: "x,y",
			cursor: "grab",
			activeCursor: "grabbing",
			bounds: "#allowedDragArea",
			edgeResistance: 0.5,
			trigger: `#title-bar-${title}`,
			zIndexBoost: false,
			onPress: () => focusApp(title),
			onRelease: () => {
				wdow.draggableWindow[0].update(true)
				wdow.setLastWindowedCSS()
				wdow.preventSubpixelValues()
			},
			allowContextMenu: true,
		})

		function genResizeDraggable({ handleOnDrag, ...vars }) {
			const parent = document.getElementById("allowedDragArea")
			const nextEle = document.createElement("div")
			nextEle.style.position = "absolute"
			parent.appendChild(nextEle)
			return Draggable.create(nextEle, {
				...vars,
				type: "x,y",
				onPress: () => {
					focusApp(title)
					wdow.draggableWindow[0].disable()
				},
				onRelease: () => {
					wdow.draggableWindow[0].enable()
					wdow.setLastWindowedCSS()
					wdow.preventSubpixelValues()
				},
				onDrag: function () {
					handleOnDrag(this, wdow.data.css.windowed)
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
				trigger: `#side-top-${title}, #corner-nw-${title}, #corner-ne-${title}`,
				cursor: "n-resize",
				handleOnDrag: function (drag, wdowCSS) {
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
				trigger: `#side-right-${title}, #corner-ne-${title}, #corner-se-${title}`,
				cursor: "e-resize",
				handleOnDrag: function (drag, wdowCSS) {
					const nextWidthBelowMin = wdowCSS.width + drag.deltaX < minWindowCSS.width
					const nextWidthAboveMax = wdowCSS.width + drag.deltaX > drag.maxX

					if (nextWidthBelowMin) wdowCSS.width = minWindowCSS.width
					else if (nextWidthAboveMax) wdowCSS.width = drag.maxX
					else wdowCSS.width += drag.deltaX

					qsWidth(wdowCSS.width)
				},
			}),
			genResizeDraggable({
				trigger: `#side-bottom-${title}, #corner-sw-${title}, #corner-se-${title}`,
				cursor: "s-resize",
				handleOnDrag: function (drag, wdowCSS) {
					const nextHeightBelowMin = wdowCSS.height + drag.deltaY < minWindowCSS.height
					const nextHeightAboveMax = wdowCSS.height + drag.deltaY > drag.maxY

					if (nextHeightBelowMin) wdowCSS.height = minWindowCSS.height
					else if (nextHeightAboveMax) wdowCSS.height = drag.maxY
					else wdowCSS.height += drag.deltaY

					qsHeight(wdowCSS.height)
				},
			}),
			genResizeDraggable({
				trigger: `#side-left-${title}, #corner-nw-${title}, #corner-sw-${title}`,
				cursor: "w-resize",
				handleOnDrag: function (drag, wdowCSS) {
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
		this.setLastWindowedCSS()
		const { title } = this.props
		const { appDrawerContent, context, ...otherState } = this.state
		const { isMobileWindow } = context
		const prevData = ls.get(title) ?? {}
		const nextData = {
			title,
			...prevData,
			window: {
				state: {
					...otherState,
					context: {
						isMobileWindow,
					},
				},
				data: { ...this.data },
			},
		}
		ls.set(title, nextData)
	}

	handleExit = () => {
		this.data.closedProperly = true
		this.save()
	}

	handleViewportResize = () => {
		if (!this.mounted) return
		const width = this.data.css.current.width
		const { isMobileWindow } = this.state.context

		if (!isMobileWindow && width < mediaBreakpoints.desktop) {
			this.setState((prev) => ({
				context: {
					...prev.context,
					isMobileWindow: true,
				},
			}))
		} else if (isMobileWindow && width >= mediaBreakpoints.desktop) {
			this.setState((prev) => ({
				context: {
					...prev.context,
					isMobileWindow: false,
				},
				appDrawerShown: false,
			}))
		}
		if (this.draggableWindow) this.draggableWindow[0].update(true)
	}

	animMinimize = (extraVars = {}) => {
		this.animate({ ...this.data.css.minimized, ...extraVars })
	}

	animWindowed = (extraVars = {}) => {
		this.animate({ ...this.data.css.windowed, ...extraVars })
	}

	animMaximize = (extraVars = {}) => {
		this.animate({ ...this.data.css.maximized, ...extraVars })
	}

	// Chrome bug causes children to become blurry on parent transforms that end in subpixel values.
	// Have to round all values at the end of animations/drags.
	preventSubpixelValues = () => {
		const { isMinimized, isMaximized } = this.props
		if (isMinimized || isMaximized || !this.rootRef.current) return

		const wdowStyles = new Styles(this.rootRef.current)
		const matrix = wdowStyles.get("transform")
		const transform = { x: Math.round(matrix[matrix.length - 2]), y: Math.round(matrix[matrix.length - 1]) }
		const top = Math.round(wdowStyles.get("top")?.[0])
		const left = Math.round(wdowStyles.get("left")?.[0])
		const width = Math.round(wdowStyles.get("width")?.[0])
		const height = Math.round(wdowStyles.get("height")?.[0])

		const roundedVars = {
			...transform,
			top,
			left,
			width,
			height,
		}

		const badValue = Object.keys(roundedVars).find((k) => !Number.isFinite(roundedVars[k]))
		if (badValue) return

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
		const wdow = this
		if (this.curAnim?.isActive()) this.curAnim.kill()
		this.curAnim = gsap.to(wdow.rootRef.current, {
			...tweenVars,
			onStart: () => {
				wdow.draggableWindow[0].disable()
				wdow.dragInstances.forEach((i) => i[0].disable())
			},
			onComplete: () => {
				if (!wdow.props.isMinimized) {
					wdow.draggableWindow[0].update(true)
					wdow.draggableWindow[0].enable()
				}
				if (!wdow.props.isMinimized && !wdow.props.isMaximized) {
					wdow.dragInstances.forEach((i) => i[0].enable())
				}
				wdow.preventSubpixelValues()
			},
			onUpdate: function () {
				wdow.data.css.current.width = this._targets[0].offsetWidth
				wdow.data.css.current.height = this._targets[0].offsetHeight
				if (!wdow.props.isMinimized) wdow.handleViewportResizeThrottled()
			},
		})
		this.curAnim.play()
	}

	setLastWindowedCSS = () => {
		const { isMinimized, isMaximized } = this.props
		if (!this.rootRef.current || gsap.isTweening(this.rootRef.current)) return
		if (isMinimized || isMaximized) return

		this.draggableWindow[0].update(true)
		const wdowStyles = new Styles(this.rootRef.current)
		this.data.css.windowed = {
			...this.data.css.windowed,
			top: wdowStyles.get("top")?.[0],
			left: wdowStyles.get("left")?.[0],
			x: this.draggableWindow[0].x,
			y: this.draggableWindow[0].y,
		}
	}

	enterAnim = () => {
		const wdow = this
		const { css } = this.data
		const { isMinimized, isMaximized } = this.props

		if (this.data.closedProperly) {
			const curStateOptions = isMaximized ? css.maximized : css.windowed
			const animTime = css.minimized.duration + curStateOptions.duration
			gsap.set(wdow.rootRef.current, { ...css.minimized })
			const vars = { duration: animTime }
			!isMaximized ? wdow.animWindowed(vars) : wdow.animMaximize(vars)
		} else {
			if (isMinimized) {
				gsap.set(wdow.rootRef.current, { ...css.minimized })
			} else {
				gsap.set(wdow.rootRef.current, { ...(isMaximized ? css.maximized : css.windowed) })
			}
		}
		this.data.closedProperly = false
	}

	render() {
		const { in: show, title, isMaximized, ...props } = this.props
		const {
			appDrawerContent,
			appDrawerShown,
			context: { isMobileWindow },
		} = this.state

		return (
			<Transition
				{...props}
				in={show}
				timeout={{ appear: 50, enter: 50, exit: this.data.css.minimized.duration * 1000 }}
				onExit={this.animMinimize}
				mountOnEnter
				unmountOnExit
				appear
			>
				<Root
					id={`window-${title}`}
					ref={this.rootRef}
					isMaximized={isMaximized}
					isFocused={this.props.isFocused}
					isMobileSite={this.props.isMobileSite}
					minWindowCSS={this.props.minWindowCSS}
					zIndex={this.props.zIndex}
				>
					<TitleBar
						id={`title-bar-${title}`}
						isFocused={this.props.isFocused}
						isMobileSite={this.props.isMobileSite}
						onDoubleClick={() => this.props.toggleMaximize(title)}
						onTouchEnd={(e) => {
							// 'onDoubleClick' doesn't work w/ touch events even though the normal 'onClick' does?
							if (isDoubleTouch(e)) this.props.toggleMaximize(title)
						}}
					>
						<Button
							onClick={this.toggleAppDrawerShown}
							svg={MenuSVG}
							disabled={appDrawerContent === null || !isMobileWindow}
						/>
						<div style={{ paddingLeft: ".25em " }}>{title}</div>
						<div style={{ display: "flex", marginLeft: "auto" }}>
							<Button onClick={() => this.props.toggleMinimize(title)} svg={MinimizeSVG} />
							<Button
								onClick={() => this.props.toggleMaximize(title)}
								svg={isMaximized ? FullscreenExitSVG : FullscreenSVG}
							/>
							<Button color="red" onClick={() => this.props.closeApp(title)} svg={CloseSVG} />
						</div>
					</TitleBar>
					<Content onClick={() => this.props.focusApp(title)}>
						<Loading isLoading={this.state.appLoading} />
						{appDrawerContent !== null && isMobileWindow && (
							<Drawer
								side={this.props.isMobileSite ? "right" : "left"}
								isShown={appDrawerShown}
								onClose={this.toggleAppDrawerShown}
							>
								{appDrawerContent}
							</Drawer>
						)}
						<Contexts.Window.Provider value={this.state.context}>
							{this.props.children}
						</Contexts.Window.Provider>
					</Content>
					<Side position="top" id={`side-top-${title}`} />
					<Side position="right" id={`side-right-${title}`} />
					<Side position="bottom" id={`side-bottom-${title}`} />
					<Side position="left" id={`side-left-${title}`} />
					<CornerNW id={`corner-nw-${title}`} />
					<CornerNE id={`corner-ne-${title}`} />
					<CornerSE id={`corner-se-${title}`} />
					<CornerSW id={`corner-sw-${title}`} />
				</Root>
			</Transition>
		)
	}
}
