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
    isMaximized: false,
    isMinimized: false
  }

  componentDidMount() {
    const id = this.props.id
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
    this.updateLayout()
  }

  componentWillUnmount() {
    this.dragInstances.forEach(i => i.kill())
  }

  componentDidUpdate(prevProps) {
    if (prevProps.isMobile !== this.props.isMobile) this.updateLayout()
  }

  updateLayout = () => {
    if (this.props.isMobile) {
      if (!this.state.isMaximized) this.maximize()
      this.dragInstances.forEach(i => i.disable())
    } else if (!this.props.isMobile) {
      if (this.lastProperties) this.restore()
      this.dragInstances.forEach(i => i.enable())
    }
  }

  minimize = () => {
    if (!this.state.isMaximized) this.setLastProperties()
    TweenLite.to(this.windowRef, animationDuration, {
      top: this.props.yOrigin - this.lastProperties.height / 2,
      left: this.props.xOrigin - this.lastProperties.width / 2,
      x: 0,
      y: 0,
      scale: 0,
      onComplete: () => TweenLite.set(this.windowRef, { display: 'none' })
    })
    this.setState({ isMinimized: true })
  }

  restore = () => {
    TweenLite.to(this.windowRef, animationDuration, {
      top: this.lastProperties.top,
      left: this.lastProperties.left,
      width: this.lastProperties.width,
      height: this.lastProperties.height,
      x: this.lastProperties.x,
      y: this.lastProperties.y,
      scale: 1
    })
    const flags = {}
    if (this.state.isMaximized && !this.state.isMinimized) flags.isMaximized = false
    if (this.state.isMinimized) flags.isMinimized = false
    if (Object.keys(flags).length > 0) this.setState(flags)
  }

  maximize = () => {
    this.setLastProperties()
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

  setLastProperties = () => {
    const { width, height } = this.windowRef.getBoundingClientRect()
    this.lastProperties = {
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
    const { id, title, isMobile, xOrigin, yOrigin, close } = this.props
    return (
      <div
        id={`window-${id}`}
        className="window"
        style={{ zIndex: this.state.zIndex, left: xOrigin, top: yOrigin }}
      >
        <div id={`window-title-bar-${id}`} className="window-title-bar">
          <div className="window-title">{title}</div>
          <div className="window-buttons">
            <button onClick={this.minimize}>-</button>
            {this.state.isMaximized ? (
              <button onClick={this.restore}>[[]</button>
            ) : (
              <button onClick={this.maximize}>[]</button>
            )}
            <button onClick={() => close(id)}>X</button>
          </div>
        </div>
        <div className="content-overflow-fix">
          <div className="content" onClick={this.zIndexUpdate}>
            {this.props.children}
          </div>
        </div>
        <div id={`side-n-${id}`} className="side n" />
        <div id={`side-e-${id}`} className="side e" />
        <div id={`side-s-${id}`} className="side s" />
        <div id={`side-w-${id}`} className="side w" />
        <div id={`corner-nw-${id}`} className="corner nw" />
        <div id={`corner-ne-${id}`} className="corner ne" />
        <div id={`corner-se-${id}`} className="corner se" />
        <div id={`corner-sw-${id}`} className="corner sw" />
      </div>
    )
  }
}
