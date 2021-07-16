import { createRef, Component } from "react"
import { gsap, Draggable } from "gsap/all"
import styled, { css } from "styled-components/macro"
import { Transition } from "react-transition-group"
import throttle from "lodash/throttle"
import merge from "lodash/merge"
import { desaturate } from "polished"

import { ReactComponent as SvgClose } from "../../shared/assets/material-icons/close.svg"
import { ReactComponent as SvgMinimize } from "../../shared/assets/material-icons/minimize.svg"
import { ReactComponent as SvgFullscreenExit } from "../../shared/assets/material-icons/fullscreen-exit.svg"
import { ReactComponent as SvgFullscreen } from "../../shared/assets/material-icons/fullscreen.svg"
import { ReactComponent as SvgMenu } from "../../shared/assets/material-icons/menu.svg"
import {
	getRect,
	isDoubleTouch,
	opac,
	ls,
	Styles,
	mediaBreakpoints,
	Contexts,
	Debug,
} from "../../shared/shared"
import Button from "../ui/Button"
import Drawer from "../ui/Drawer"
import LoadingScreen from "../ui/Loading"

gsap.registerPlugin(Draggable)

/* --------------------------------- STYLES --------------------------------- */

const WindowDesktopDrawer = styled.div`
	flex: 1 1;
	min-width: 20ch;
	max-width: 50ch;
	height: 100%;
	overflow: hidden;
	> div {
		height: 100%;
		overflow-x: hidden;
		overflow-y: auto;
	}
	${({ theme }) => css`
		border-right: 1px solid ${theme.accent};
	`}
`

const Root = styled.div`
	position: absolute;
	max-width: 100vw;
	max-height: 100vh;
	visibility: hidden;
	backface-visibility: hidden;
	${({ minWindowCSS, zIndex, isFocused, isMobileSite, isMaximized, theme }) => css`
		background: ${theme.background};
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
			: `1px solid ${opac(0.6, theme.accent)}`};
		${isFocused &&
		css`
			filter: drop-shadow(0px -1px 5px ${opac(0.6, desaturate(0.1, theme.accent))});
		`}
	`}
`

const OverflowGuard = styled.div`
	overflow: hidden;
	height: 100%;
	width: 100%;
	display: flex;
	flex-direction: column;
`

const Interactables = styled.div`
	height: 0;
	width: 0;
	${({ isMaximized }) => css`
		> * {
			z-index: 15000;
			pointer-events: ${isMaximized ? "none" : null};
		}
	`}
`

const TitleBar = styled.div`
	position: relative;
	z-index: 10000;
	flex: 0 0 auto;
	font-weight: bold;
	align-items: center;
	height: var(--nav-height);
	backface-visibility: hidden;
	cursor: pointer;
	button {
		margin: 1px;
		font-size: 0.9em;
	}
	button + button {
		margin-left: 2px;
	}
	${({ isMobileSite, theme, isFocused }) => css`
		${isFocused
			? css`
					filter: drop-shadow(0px -1px 6px ${opac(0.6, desaturate(0.1, theme.accent))});
			  `
			: css`
					filter: grayscale(0.3) saturate(0.8) brightness(0.9);
			  `}
		color: ${theme.highlightContrast};
		border-bottom: 1px solid ${theme.accent};
		display: ${isMobileSite ? "none" : "flex"};
		background: ${theme.highlight};
	`}
`

const WindowName = styled.div`
	padding-left: 0.25em;
	font-size: 1.1em;
`

const TitleBarBtn = styled(Button).attrs((props) => {
	return {
		...props,
		setColor: "highlightContrast",
	}
})``

const TitleBarCloseBtn = styled(Button).attrs(({ theme, setColor, winFocused, ...props }) => {
	if (theme.name == "red" || theme.name == "dark") setColor = "backgroundContrast"
	return { ...props, theme, setColor, winFocused }
})``

const AppContainer = styled.div`
	flex: 1 1;
	display: flex;
	position: relative;
	overflow: hidden;
	${({ theme, isMobileWindow }) => css`
		--content-spacing: ${isMobileWindow ? 1.25 : 2}rem;
		section {
			overflow: auto;
			max-width: 1024px;
			margin: 0 auto;
			padding: 0 var(--content-spacing);
			> div {
				margin: var(--content-spacing) 0;
			}
		}
		p,
		ul {
			margin: calc(var(--content-spacing) / 2) 0;
		}
		li::marker {
			color: ${theme.highlight};
		}
		.enpha {
			font-weight: bold;
			color: ${theme.highlight};
			font-size: 1.1em;
		}
	`}
`

const AppContent = styled.div`
	overflow-x: hidden;
	overflow-y: auto;
	position: relative;
	flex: 2 1;
	${({ theme }) => css`
		color: ${theme.backgroundContrast};
	`}
`

// Change these to control the sizes for the interactive parts of the component.
const sideSize = "0.75em"
const sideOffset = `calc(${sideSize} / 2 * -1)`
const Side = styled.div.attrs(({ position }) => {
	return {
		style: {
			[position]: sideOffset,
		},
	}
})`
	position: absolute;
	${({ position }) => {
		return ["top", "bottom"].includes(position)
			? css`
					height: ${sideSize};
					width: 100%;
			  `
			: css`
					top: 0;
					height: 100%;
					width: ${sideSize};
			  `
	}}
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

const DragRef = styled.div`
	visibility: hidden;
	position: absolute;
`

/* -------------------------------- COMPONENT ------------------------------- */

// eslint-disable-next-line no-unused-vars
const debug = new Debug("Window: ", true)

export default class Window extends Component {
	constructor(props) {
		super(props)
		this.rootRef = createRef()
		this.handleResizeThrottled = throttle(this.handleResize, 200)

		const wireframe = getRect("window-wireframe")
		const prevData = ls.get(`Window-${props.title}`) ?? {}
		const { window: loadedWdow } = prevData
		this.data = loadedWdow?.data ?? {
			closedProperly: true,
			css: {
				minimized: {
					scale: 0,
					ease: "back.in(1.75)",
					duration: 0.35,
					autoAlpha: 0,
				},
				windowed: {
					top: wireframe?.top,
					left: wireframe?.left,
					width: wireframe?.width,
					height: wireframe?.height,
					scale: 1,
					x: 0,
					y: 0,
					autoAlpha: 1,
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
					autoAlpha: 1,
					ease: "bounce.out",
					duration: 0.75,
				},
			},
		}
		this.state = merge(
			{
				context: {
					isFocused: props.isFocused,
					isMobileSite: props.isMobileSite,
					isMobileWindow: props.isMobileSite,
					setAppDrawerContent: this.setAppDrawerContent,
					setAppLoading: this.setAppLoading,
					setAppDrawerShown: this.setAppDrawerShown,
				},
				appLoading: false,
				appDrawerContent: null,
				appDrawerShown: false,
			},
			loadedWdow?.state ?? {}
		)
	}

	componentDidMount() {
		this.genDraggables()
		this.enterAnim()
		document.addEventListener("visibilitychange", this.save)
		window.addEventListener("resize", this.handleResizeThrottled)
		this.handleResizeThrottled()
		this.determineMainNavBurgerCB()
	}

	componentWillUnmount() {
		this.handleExit()
		document.removeEventListener("visibilitychange", this.save)
		window.removeEventListener("resize", this.handleResizeThrottled)
		this.handleResizeThrottled.cancel()
		if (this.dragInstances) this.dragInstances.forEach((i) => i[0].kill())
	}

	componentDidUpdate(prevProps, prevState) {
		const { isMobileSite, isMinimized, isMaximized, isFocused } = this.props

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

		// If app is focused and isMobileSite 'setMainNavBurgerCB' from Display to this app's Drawer open/close toggle.
		if (!prevProps.isFocused && isFocused) {
			this.determineMainNavBurgerCB()
		}

		// Instead of having separate contexts, I'm combining them here so I can use them easier in class components.
		const stateChanges = {}
		if (prevProps.isFocused !== isFocused) stateChanges.isFocused = isFocused
		if (prevProps.isMobileSite !== isMobileSite) stateChanges.isMobileSite = isMobileSite
		if (Object.keys(stateChanges).length > 0)
			this.setState((prev) => ({ context: { ...prev.context, ...stateChanges } }))

		// Resize listener isn't sufficient for all cases if window instantly resizes.
		if (prevProps.isMobileSite !== isMobileSite) this.handleResizeThrottled()
	}

	determineMainNavBurgerCB = () => {
		const { isMobileSite, isFocused, mainNavBurgerCB, setMainNavBurgerCB } = this.props
		const { isMobileWindow } = this.state.context

		const mobile = isMobileWindow || isMobileSite
		const difFn = mainNavBurgerCB !== this.setAppDrawerShown
		if (isFocused && mobile && difFn) {
			const cb = this.state.appDrawerContent ? this.setAppDrawerShown : null
			setMainNavBurgerCB(cb)
		}
	}

	setAppDrawerShown = (bool) => {
		const { appDrawerShown } = this.state
		this.setState({ appDrawerShown: typeof bool === "boolean" ? bool : !appDrawerShown })
	}

	setAppDrawerContent = (appDrawerContent) => {
		this.setState({ appDrawerContent }, () => this.determineMainNavBurgerCB())
	}

	setAppLoading = (bool) => {
		this.setState((prev) => ({
			appLoading: typeof bool === "boolean" ? bool : !prev.appLoading,
		}))
	}

	genDraggables = () => {
		const { title, focusApp, minWindowCSS, isMobileSite, isMaximized } = this.props
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
		if (isMaximized) this.draggableWindow[0].disable()

		this.dragArea = document.getElementById("allowedDragArea")

		function genResizeDraggable({ side, handleOnDrag, ...vars }) {
			const nextEle = document.getElementById(`dragRef-${side}-${title}`)
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
					wdow.handleResizeThrottled()
				},
				allowContextMenu: true,
			})
		}

		// GSAP quick setters have better performance than the traditional gsap.set()
		const qsWidth = gsap.quickSetter(wdowEle, "width", "px")
		const qsHeight = gsap.quickSetter(wdowEle, "height", "px")
		this.gsapQS = gsap.quickSetter(wdowEle, "css")

		this.dragInstances = [
			this.draggableWindow,
			genResizeDraggable({
				trigger: `#side-top-${title}, #corner-nw-${title}, #corner-ne-${title}`,
				cursor: "n-resize",
				side: "top",
				handleOnDrag: function (drag, wdowCSS) {
					const nextHeightBelowMin = wdowCSS.height - drag.deltaY < minWindowCSS.height
					const nextHeightAboveMax = wdowCSS.height - drag.deltaY > wdow.dragArea.clientHeight

					if (nextHeightBelowMin) drag.deltaY = wdowCSS.height - minWindowCSS.height
					else if (nextHeightAboveMax) drag.deltaY = wdow.dragArea.clientHeight - wdowCSS.height
					wdowCSS.height -= drag.deltaY

					qsHeight(wdowCSS.height)
					wdow.gsapQS({ y: `+=${drag.deltaY}` })
				},
			}),
			genResizeDraggable({
				trigger: `#side-right-${title}, #corner-ne-${title}, #corner-se-${title}`,
				cursor: "e-resize",
				side: "right",
				handleOnDrag: function (drag, wdowCSS) {
					const nextWidthBelowMin = wdowCSS.width + drag.deltaX < minWindowCSS.width
					const nextWidthAboveMax = wdowCSS.width + drag.deltaX > wdow.dragArea.clientWidth

					if (nextWidthBelowMin) wdowCSS.width = minWindowCSS.width
					else if (nextWidthAboveMax) wdowCSS.width = wdow.dragArea.clientWidth
					else wdowCSS.width += drag.deltaX

					qsWidth(wdowCSS.width)
				},
			}),
			genResizeDraggable({
				trigger: `#side-bottom-${title}, #corner-sw-${title}, #corner-se-${title}`,
				cursor: "s-resize",
				side: "bottom",
				handleOnDrag: function (drag, wdowCSS) {
					const nextHeightBelowMin = wdowCSS.height + drag.deltaY < minWindowCSS.height
					const nextHeightAboveMax = wdowCSS.height + drag.deltaY > wdow.dragArea.clientHeight

					if (nextHeightBelowMin) wdowCSS.height = minWindowCSS.height
					else if (nextHeightAboveMax) wdowCSS.height = wdow.dragArea.clientHeight
					else wdowCSS.height += drag.deltaY

					qsHeight(wdowCSS.height)
				},
			}),
			genResizeDraggable({
				trigger: `#side-left-${title}, #corner-nw-${title}, #corner-sw-${title}`,
				cursor: "w-resize",
				side: "left",
				handleOnDrag: function (drag, wdowCSS) {
					const nextWidthBelowMin = wdowCSS.width - drag.deltaX < minWindowCSS.width
					const nextWidthAboveMax = wdowCSS.width - drag.deltaX > wdow.dragArea.clientWidth

					if (nextWidthBelowMin) drag.deltaX = wdowCSS.width - minWindowCSS.width
					else if (nextWidthAboveMax) drag.deltaX = wdowCSS.width - wdow.dragArea.clientWidth
					wdowCSS.width -= drag.deltaX

					qsWidth(wdowCSS.width)
					wdow.gsapQS({ x: `+=${drag.deltaX}` })
				},
			}),
		]
		if (isMobileSite) this.dragInstances.forEach((i) => i[0].disable())
	}

	save = () => {
		this.setLastWindowedCSS()
		const { title } = this.props
		const { appDrawerContent, context, ...otherState } = this.state
		const prevData = ls.get(`Window-${title}`) ?? {}
		const nextData = {
			title,
			...prevData,
			window: {
				state: {
					...otherState,
				},
				data: { ...this.data },
			},
		}
		ls.set(`Window-${title}`, nextData)
	}

	handleExit = () => {
		this.data.closedProperly = true
		this.save()
	}

	handleResize = () => {
		if (!this.rootRef.current) return
		const width = this.rootRef.current.offsetWidth
		const { isMobileWindow } = this.state.context
		const { isMobileSite } = this.props

		if ((!isMobileWindow && isMobileSite) || (!isMobileWindow && width < mediaBreakpoints.desktop)) {
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
		this.checkWindowedCSS()
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

		this.wdowStyles = this.wdowStyles ?? new Styles(this.rootRef.current)
		const matrix = this.wdowStyles.get("transform")
		const transform = { x: Math.round(matrix[matrix.length - 2]), y: Math.round(matrix[matrix.length - 1]) }
		const top = Math.round(this.wdowStyles.get("top")?.[0])
		const left = Math.round(this.wdowStyles.get("left")?.[0])
		const width = Math.round(this.wdowStyles.get("width")?.[0])
		const height = Math.round(this.wdowStyles.get("height")?.[0])

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
					wdow.draggableWindow[0].enabled(!wdow.props.isMaximized)
				}
				if (!wdow.props.isMinimized && !wdow.props.isMaximized) {
					wdow.dragInstances.forEach((i) => i[0].enable())
				}
				wdow.preventSubpixelValues()
			},
			onUpdate: function () {
				if (!wdow.props.isMinimized) wdow.handleResizeThrottled()
			},
		})
		this.curAnim.play()
	}

	setLastWindowedCSS = () => {
		const { isMinimized, isMaximized } = this.props
		if (!this.rootRef.current || gsap.isTweening(this.rootRef.current) || isMinimized || isMaximized) return

		this.draggableWindow[0].update(true)
		this.wdowStyles = this.wdowStyles ?? new Styles(this.rootRef.current)

		this.data.css.windowed = {
			...this.data.css.windowed,
			top: this.wdowStyles.get("top")?.[0],
			left: this.wdowStyles.get("left")?.[0],
			x: this.draggableWindow[0].x,
			y: this.draggableWindow[0].y,
		}
	}

	// Check to see if current windowed CSS is within the drag area bounds. Have to check this because
	// the user might resize their browser after leaving the site, which will make the window out of bounds.
	checkWindowedCSS = () => {
		const { css } = this.data
		const { width: wdowWidth, height: wdowHeight } = css.windowed
		if (wdowWidth > this.dragArea?.clientWidth || wdowHeight > this.dragArea?.clientHeight) {
			const wireframe = getRect("window-wireframe")
			if (wireframe?.top) {
				css.windowed = {
					...css.windowed,
					top: Math.round(wireframe?.top),
					left: Math.round(wireframe?.left),
					width: Math.round(wireframe?.width),
					height: Math.round(wireframe?.height),
				}
			}
		}
	}

	enterAnim = () => {
		const { css } = this.data
		const { isMinimized, isMaximized } = this.props

		this.checkWindowedCSS()

		if (this.data.closedProperly) {
			const curStateOptions = isMaximized ? css.maximized : css.windowed
			const animTime = css.minimized.duration + curStateOptions.duration
			gsap.set(this.rootRef.current, { ...css.minimized })
			const vars = { duration: animTime }
			!isMaximized ? this.animWindowed(vars) : this.animMaximize(vars)
		} else {
			if (isMinimized) {
				gsap.set(this.rootRef.current, { ...css.minimized })
			} else {
				gsap.set(this.rootRef.current, { ...(isMaximized ? css.maximized : css.windowed) })
			}
		}
		this.data.closedProperly = false
	}

	render() {
		const { in: show, title, isMaximized, isFocused, ...props } = this.props
		const {
			appDrawerContent,
			appDrawerShown,
			context: { isMobileWindow },
		} = this.state

		let drawer = null
		if (appDrawerContent) {
			drawer = isMobileWindow ? (
				<Drawer
					side={this.props.isMobileSite ? "right" : "left"}
					isShown={appDrawerShown}
					onClose={this.setAppDrawerShown}
				>
					{appDrawerContent}
				</Drawer>
			) : (
				<WindowDesktopDrawer>{appDrawerContent}</WindowDesktopDrawer>
			)
		}

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
					isFocused={isFocused}
					isMobileSite={this.props.isMobileSite}
					minWindowCSS={this.props.minWindowCSS}
					zIndex={this.props.zIndex}
				>
					<OverflowGuard>
						<TitleBar
							id={`title-bar-${title}`}
							isFocused={isFocused}
							isMobileSite={this.props.isMobileSite}
							onClick={() => this.props.focusApp(title)}
							onDoubleClick={() => this.props.toggleMaximize(title)}
							onTouchEnd={(e) => {
								// 'onDoubleClick' doesn't work w/ touch events even though the normal 'onClick' does?
								if (isDoubleTouch(e)) this.props.toggleMaximize(title)
							}}
						>
							<TitleBarBtn
								onClick={this.setAppDrawerShown}
								svg={SvgMenu}
								disabled={appDrawerContent === null || !isMobileWindow}
								winFocused={isFocused}
							/>
							<WindowName>{title}</WindowName>
							<TitleBarBtn
								onClick={() => this.props.toggleMinimize(title)}
								svg={SvgMinimize}
								winFocused={isFocused}
								style={{ marginLeft: "auto" }}
							/>
							<TitleBarBtn
								onClick={() => this.props.toggleMaximize(title)}
								svg={isMaximized ? SvgFullscreenExit : SvgFullscreen}
								winFocused={isFocused}
							/>
							<TitleBarCloseBtn
								onClick={() => this.props.closeApp(title)}
								svg={SvgClose}
								winFocused={isFocused}
								setTheme="red"
								setColor="primary"
							/>
						</TitleBar>
						<AppContainer onClick={() => this.props.focusApp(title)} isMobileWindow={isMobileWindow}>
							<Contexts.Window.Provider value={this.state.context}>
								{drawer}
								<AppContent id={`app-content-${title}`}>{this.props.children}</AppContent>
								<LoadingScreen isLoading={this.state.appLoading} />
							</Contexts.Window.Provider>
						</AppContainer>
					</OverflowGuard>
					<Interactables isMaximized={isMaximized}>
						<Side position="top" id={`side-top-${title}`} />
						<Side position="right" id={`side-right-${title}`} />
						<Side position="bottom" id={`side-bottom-${title}`} />
						<Side position="left" id={`side-left-${title}`} />
						<DragRef id={`dragRef-top-${title}`} />
						<DragRef id={`dragRef-right-${title}`} />
						<DragRef id={`dragRef-bottom-${title}`} />
						<DragRef id={`dragRef-left-${title}`} />
						<CornerNW id={`corner-nw-${title}`} />
						<CornerNE id={`corner-ne-${title}`} />
						<CornerSE id={`corner-se-${title}`} />
						<CornerSW id={`corner-sw-${title}`} />
					</Interactables>
				</Root>
			</Transition>
		)
	}
}
