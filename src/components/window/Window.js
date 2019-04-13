import './window.scss'

import React from 'react'
import { Draggable, TweenLite } from 'gsap/all'

import { getStyleProperty } from '../../shared/helpers'

// Chrome WebKit bug causes blurry text/images on child elements upon parent 3D transform.
// This is a flag to disable 3D transforms in Chrome for Window components.
const isChrome = !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime)

// GSAP's Draggable has a built in z-index updater which is shared by every instance, but it
// doesn't update in every circumstance we want, so we update z-index ourselves.
let zIndexLeader = 999

// Duration (in seconds) of TweenLite animations for the Window component.
const animationDuration = 0.4

export default class extends React.Component {
  state = {
    zIndex: ++zIndexLeader,
    isMaximized: false
  }

  componentDidMount() {
    const id = this.props.appData.id
    const windowRef = document.getElementById(`window-${id}`)
    this.windowRef = windowRef

    this.windowDraggable = new Draggable(windowRef, {
      // force3D: isChrome ? false : true,
      bounds: '.display',
      edgeResistance: 0.5,
      trigger: `#window-title-bar-${id}`,
      zIndexBoost: false,
      onPress: this.zIndexUpdate
    })

    const genResizeDraggable = (target, vars) =>
      new Draggable(target, {
        ...vars,
        onPress: () => {
          this.zIndexUpdate()
          this.windowDraggable.disable()
        },
        onRelease: this.windowDraggable.enable
      })

    this.dragInstances = [
      this.windowDraggable,
      genResizeDraggable(document.createElement('div'), {
        trigger: `#side-n-${id}, #corner-nw-${id}, #corner-ne-${id}`,
        cursor: 'n-resize',
        onDrag: function() {
          TweenLite.set(windowRef, { height: `-=${this.deltaY}`, y: `+=${this.deltaY}` })
        }
      }),
      genResizeDraggable(document.createElement('div'), {
        trigger: `#side-e-${id}, #corner-ne-${id}, #corner-se-${id}`,
        cursor: 'e-resize',
        onDrag: function(e) {
          TweenLite.set(windowRef, { width: `+=${this.deltaX}` })
        }
      }),
      genResizeDraggable(document.createElement('div'), {
        trigger: `#side-s-${id}, #corner-sw-${id}, #corner-se-${id}`,
        cursor: 's-resize',
        onDrag: function() {
          TweenLite.set(windowRef, { height: `+=${this.deltaY}` })
        }
      }),
      genResizeDraggable(document.createElement('div'), {
        trigger: `#side-w-${id}, #corner-nw-${id}, #corner-sw-${id}`,
        cursor: 'w-resize',
        onDrag: function() {
          TweenLite.set(windowRef, { width: `-=${this.deltaX}`, x: `+=${this.deltaX}` })
        }
      })
    ]
    if (this.props.isMobile) this.maximize()
  }

  componentWillUnmount() {
    this.dragInstances.forEach(i => i.kill())
  }

  shouldComponentUpdate(nextProps, nextState) {
    const layoutChange = nextProps.isMobile !== this.props.isMobile
    const minimizeChange = nextProps.isMinimized !== this.props.isMinimized
    const maximizeChange = nextState.isMaximized !== this.state.isMaximized
    return layoutChange || minimizeChange || maximizeChange
  }

  componentDidUpdate(prevProps) {
    if (prevProps.isMobile !== this.props.isMobile) {
      if (this.props.isMobile) this.maximize()
      else this.restore()
    }
    if (prevProps.isMinimized !== this.props.isMinimized) {
      if (this.props.isMinimized) this.minimize()
      else this.restore()
    }
  }

  minimize = () => {
    this.setProperties()
    TweenLite.to(this.windowRef, animationDuration, {
      top: this.props.appData.origin.y - this.prevStyle.height / 2,
      left: this.props.appData.origin.x - this.prevStyle.width / 2,
      x: 0,
      y: 0,
      scale: 0.25,
      onComplete: () => TweenLite.set(this.windowRef, { display: 'none' })
    })
  }

  restore = () => {
    TweenLite.set(this.windowRef, { display: 'flex' })
    TweenLite.to(this.windowRef, animationDuration, {
      top: this.prevStyle.top,
      left: this.prevStyle.left,
      width: this.prevStyle.width,
      height: this.prevStyle.height,
      x: this.prevStyle.x,
      y: this.prevStyle.y,
      scale: 1
    })
    if (this.state.isMaximized) this.setState({ isMaximized: false })
  }

  maximize = () => {
    this.setProperties()
    TweenLite.to(this.windowRef, animationDuration, {
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      x: 0,
      y: 0
    })
    this.setState({ isMaximized: true })
  }

  setProperties = () => {
    const { width, height } = this.windowRef.getBoundingClientRect()
    this.prevStyle = {
      top: getStyleProperty(this.windowRef, 'top', true),
      left: getStyleProperty(this.windowRef, 'left', true),
      x: this.windowDraggable.x,
      y: this.windowDraggable.y,
      width,
      height
    }
  }

  zIndexUpdate = () => {
    if (this.state.zIndex !== zIndexLeader) this.setState({ zIndex: ++zIndexLeader })
  }

  render() {
    const { appData, toggleMinimize, closeApp } = this.props
    return (
      <div
        id={`window-${appData.id}`}
        className="window"
        style={{ zIndex: this.state.zIndex, left: appData.origin.x, top: appData.origin.y }}
      >
        <div id={`window-title-bar-${appData.id}`} className="window-title-bar">
          <div className="window-title">{appData.component.title}</div>
          <div className="window-buttons">
            <button onClick={() => toggleMinimize(appData.id)}>-</button>
            {this.state.isMaximized ? (
              <button onClick={this.restore}>[[]</button>
            ) : (
              <button onClick={this.maximize}>[]</button>
            )}
            <button onClick={() => closeApp(appData.id)}>X</button>
          </div>
        </div>
        <div className="content-overflow-fix">
          <div className="content" onClick={this.zIndexUpdate}>
            {this.props.children}
          </div>
        </div>
        <div id={`side-n-${appData.id}`} className="side n" />
        <div id={`side-e-${appData.id}`} className="side e" />
        <div id={`side-s-${appData.id}`} className="side s" />
        <div id={`side-w-${appData.id}`} className="side w" />
        <div id={`corner-nw-${appData.id}`} className="corner nw" />
        <div id={`corner-ne-${appData.id}`} className="corner ne" />
        <div id={`corner-se-${appData.id}`} className="corner se" />
        <div id={`corner-sw-${appData.id}`} className="corner sw" />
      </div>
    )
  }
}
