// MAYBE - Drag to top to maximize / snapping to left or right to take up half of width.

import React from 'react'
import { TweenMax, Draggable } from 'gsap/all'
import styled, { css } from 'styled-components/macro'

import { getStyleProperty } from '../../shared/helpers'
import { windowCSS } from '../../shared/variables'

// Chrome WebKit bug causes blurry text/images on child elements upon parent 3D transform.
// This is a flag to disable 3D transforms in Chrome for Window components.
const isChrome = !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime)

// GSAP's Draggable has a built in z-index updater which is shared by every instance, but it doesn't...
// ...update in every circumstance we want, so we update z-index ourselves.
let zIndexLeader = 999

const Window = styled.div.attrs(({ app }) => {
  const { top, left } = app.origins.shortcut.getBoundingClientRect()
  return {
    style: {
      zIndex: ++zIndexLeader,
      top: `${top}px`,
      left: `${left}px`,
      transform: isChrome ? 'matrix(0.25, 0, 0, 0.25, 0, 0)' : 'scale(0.25, 0.25)',
      opacity: 0.25,
    },
  }
})`
  position: absolute;
  display: flex;
  flex-direction: column;
  min-width: ${windowCSS.minWidth}px;
  min-height: ${windowCSS.minHeight}px;
  border: ${({ isMaximized }) => (isMaximized ? 'none' : '.1rem solid rgba(0,0,0,.5)')};
`

const TitleBar = styled.div`
  background: coral;
  display: ${props => (props.isMobile ? 'none' : 'block')};
`

const ContentOverflowFix = styled.div`
  overflow-y: auto;
  flex: 1;
`

const Content = styled.div`
  height: 100%;
  background: white;
`

// Change this to control proportions of offset and the Corner styled-component!
const sideSize = '0.25rem'
const sideOffset = `calc(${sideSize} / 2 * -1)`
const Side = styled.div.attrs(props => ({
  style: {
    [props.position]: sideOffset,
  },
}))`
  position: absolute;
  ${props =>
    ['top', 'bottom'].indexOf(props.position) > -1
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
    // Setting up initial opening position the Window animates to.
    const { top, left, width, height } = document
      .getElementById('window-wireframe')
      .getBoundingClientRect()
    this.lastStyle = {
      top,
      left,
      width,
      height,
      scale: 1,
      opacity: 1,
      display: 'flex',
    }
    this.state = {
      isMinimized: false,
      isMaximized: false,
      isWindowed: true,
    }
    this.elementRef = React.createRef()
  }

  componentDidMount() {
    const id = this.props.app.id
    const windowElement = this.elementRef.current

    this.windowDraggable = new Draggable(windowElement, {
      force3D: !isChrome,
      bounds: '#display',
      edgeResistance: 0.5,
      trigger: `#title-bar-${id}`,
      zIndexBoost: false,
      onPress: this.moveOnTop,
    })

    const genResizeDraggable = (target, vars) =>
      new Draggable(target, {
        ...vars,
        onPress: () => {
          this.moveOnTop()
          this.windowDraggable.disable()
        },
        onRelease: this.windowDraggable.enable,
      })

    // Used to prevent lowering width/height below `min-(width/height)` from styled-component.
    let { width, height } = this.lastStyle

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

    // GROSS - Have to skip `setLastStyle()` on initial opening, can't think of an easier way to do this.
    if (this.props.isMobile) this.maximize(['skipSetLastStyle'])
    else this.animate(this.lastStyle, ['skipSetLastStyle'])
  }

  componentWillUnmount() {
    this.dragInstances.forEach(i => i.kill())
  }

  updateState = newState => {
    const mergedState = {
      ...this.state,
      ...newState,
    }
    const nextState = {
      ...mergedState,
      isWindowed: mergedState.isMinimized || mergedState.isMaximized ? false : true,
    }

    this.setState(nextState)
  }

  log = msg => {
    console.log(`window#${this.props.app.id} - ${msg}`)
  }

  minimize = (options = []) => {
    this.log('minimize()')

    const { top, left } = this.props.app.origins.navigationRef.current.getBoundingClientRect()
    const { width } = this.elementRef.current.getBoundingClientRect()
    this.animate(
      {
        top,
        left: left - width / 2,
        x: 0,
        y: 0,
        scale: 0.2,
        opacity: 0,
        display: 'none',
      },
      options,
    )
    if (!options.includes('skipFocusBelowWindow')) this.props.focusBelowWindow(this)
    this.updateState({ isMinimized: true })
  }

  toggleMinimize = () => {
    this.log('toggleMin()')
    if (this.state.isMinimized) this.restore()
    else if (!this.moveOnTop()) this.minimize()
  }

  restore = options => {
    if (this.state.isMinimized && this.state.isMaximized) {
      this.maximize()
      return
    }
    this.log('restore()')
    this.animate(this.lastStyle, options)
    this.updateState({ isMinimized: false, isMaximized: false })
  }

  maximize = options => {
    this.log('maximize()')
    this.animate(
      {
        ...this.lastStyle,
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        x: 0,
        y: 0,
      },
      options,
    )
    this.updateState({ isMinimized: false, isMaximized: true })
  }

  toggleMaximize = () => {
    if (this.state.isMaximized) this.restore()
    else this.maximize()
  }

  animate = (tweenVars, options = []) => {
    if (!options.includes('skipSetLastStyle')) this.setLastStyle()
    if (!options.includes('skipMoveOnTop')) this.moveOnTop()
    // Have to clone 'tweenVars' parameter since TweenMax will alter object reference otherwise...
    const clonedVars = { ...tweenVars }
    TweenMax.to(this.elementRef.current, 0.4, clonedVars)
  }

  setLastStyle = () => {
    if (!this.state.isWindowed || TweenMax.isTweening(this.elementRef.current)) return
    this.windowDraggable.update()

    const { width, height } = this.elementRef.current.getBoundingClientRect()
    this.lastStyle = {
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

  isOnTop = () => getStyleProperty(this.elementRef.current, 'z-index', true) === zIndexLeader

  moveOnTop = () => {
    this.log('focus()')
    if (!this.isOnTop()) {
      TweenMax.set(this.elementRef.current, { zIndex: ++zIndexLeader })
      return true
    } else return false
  }

  render() {
    const { app, closeApp, isMobile } = this.props
    const { isMaximized } = this.state
    return (
      <Window
        id={`window-${app.id}`}
        ref={this.elementRef}
        app={app}
        isMaximized={isMaximized}
        isMobile={isMobile}
      >
        <TitleBar id={`title-bar-${app.id}`} isMobile={isMobile} onDoubleClick={this.toggleMaximize}>
          <span>
            {app.component.title}#{app.id}
          </span>
          <div style={{ float: 'right' }}>
            <button onClick={() => this.minimize()}>-</button>
            {isMaximized ? (
              <button onClick={() => this.restore()}>[[]</button>
            ) : (
              <button onClick={() => this.maximize()}>[]</button>
            )}
            <button onClick={() => closeApp(app.id)}>X</button>
          </div>
        </TitleBar>
        <ContentOverflowFix>
          <Content onClick={this.moveOnTop}>{this.props.children}</Content>
        </ContentOverflowFix>
        <Side position="top" id={`side-top-${app.id}`} />
        <Side position="right" id={`side-right-${app.id}`} />
        <Side position="bottom" id={`side-bottom-${app.id}`} />
        <Side position="left" id={`side-left-${app.id}`} />
        <CornerNW id={`corner-nw-${app.id}`} />
        <CornerNE id={`corner-ne-${app.id}`} />
        <CornerSE id={`corner-se-${app.id}`} />
        <CornerSW id={`corner-sw-${app.id}`} />
      </Window>
    )
  }
}
