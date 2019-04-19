import './window.scss'

import React from 'react'
import { Draggable, TweenMax } from 'gsap/all'

import { getStyleProperty } from '../../shared/helpers'

// Chrome WebKit bug causes blurry text/images on child elements upon parent 3D transform.
// This is a flag to disable 3D transforms in Chrome for Window components.
const isChrome = !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime)

// GSAP's Draggable has a built in z-index updater which is shared by every instance, but it
// doesn't update in every circumstance we want, so we update z-index ourselves.
let zIndexLeader = 999

export default class Window extends React.Component {
  state = {
    zIndex: ++zIndexLeader,
    isMinimized: false,
    isMaximized: false
  }

  componentDidMount() {
    const id = this.props.app.id
    const windowRef = document.getElementById(`window-${id}`)
    this.windowRef = windowRef

    this.windowDraggable = new Draggable(windowRef, {
      force3D: isChrome ? false : true,
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
          TweenMax.set(windowRef, { height: `-=${this.deltaY}`, y: `+=${this.deltaY}` })
        }
      }),
      genResizeDraggable(document.createElement('div'), {
        trigger: `#side-e-${id}, #corner-ne-${id}, #corner-se-${id}`,
        cursor: 'e-resize',
        onDrag: function(e) {
          TweenMax.set(windowRef, { width: `+=${this.deltaX}` })
        }
      }),
      genResizeDraggable(document.createElement('div'), {
        trigger: `#side-s-${id}, #corner-sw-${id}, #corner-se-${id}`,
        cursor: 's-resize',
        onDrag: function() {
          TweenMax.set(windowRef, { height: `+=${this.deltaY}` })
        }
      }),
      genResizeDraggable(document.createElement('div'), {
        trigger: `#side-w-${id}, #corner-nw-${id}, #corner-sw-${id}`,
        cursor: 'w-resize',
        onDrag: function() {
          TweenMax.set(windowRef, { width: `-=${this.deltaX}`, x: `+=${this.deltaX}` })
        }
      })
    ]
  }

  componentWillUnmount() {
    this.dragInstances.forEach(i => i.kill())
  }

  minimize = () => {
    if (this.state.isMinimized) return

    const { width, height } = this.windowRef.getBoundingClientRect()
    this.animate({
      top: this.props.app.origin.y - height / 2,
      left: this.props.app.origin.x - width / 2,
      x: 0,
      y: 0,
      scale: 0.25,
      opacity: 0,
      onComplete: () => TweenMax.set(this.windowRef, { display: 'none' })
    })
    this.setState({ isMinimized: true })
  }

  restore = () => {
    if (!this.state.isMinimized && !this.state.isMaximized) return
    if (this.state.isMinimized && this.state.isMaximized) {
      this.maximize()
      return
    }

    this.animate(this.windowedStyle)
    this.setState({ isMinimized: false, isMaximized: false })
  }

  maximize = () => {
    this.animate({
      ...this.windowedStyle,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      x: 0,
      y: 0
    })
    this.setState({ isMinimized: false, isMaximized: true })
  }

  animate = vars => {
    const clonedVars = { ...vars }
    this.setWindowedStyle()
    TweenMax.to(this.windowRef, 0.4, clonedVars)
  }

  setWindowedStyle = () => {
    if (this.state.isMaximized || this.state.isMinimized || TweenMax.isTweening(this.windowRef)) return
    this.windowDraggable.update()

    const { width, height } = this.windowRef.getBoundingClientRect()
    this.windowedStyle = {
      top: getStyleProperty(this.windowRef, 'top', true),
      left: getStyleProperty(this.windowRef, 'left', true),
      x: this.windowDraggable.x,
      y: this.windowDraggable.y,
      width,
      height,
      scale: 1,
      opacity: 1,
      display: 'flex'
    }
  }

  zIndexUpdate = () => {
    const update = this.state.zIndex !== zIndexLeader
    if (update) this.setState({ zIndex: ++zIndexLeader })
    return update
  }

  render() {
    const { app, closeApp } = this.props
    return (
      <div
        id={`window-${app.id}`}
        className="window"
        style={{ zIndex: this.state.zIndex, left: app.origin.x, top: app.origin.y }}
      >
        <div id={`window-title-bar-${app.id}`} className="window-title-bar">
          <div className="window-title">{app.component.title}</div>
          <div className="window-buttons">
            <button onClick={this.minimize}>-</button>
            {this.state.isMaximized ? (
              <button onClick={this.restore}>[[]</button>
            ) : (
              <button onClick={this.maximize}>[]</button>
            )}
            <button onClick={() => closeApp(app.id)}>X</button>
          </div>
        </div>
        <div className="content-overflow-fix">
          <div className="content" onClick={this.zIndexUpdate}>
            {this.props.children}
          </div>
        </div>
        <div id={`side-n-${app.id}`} className="side n" />
        <div id={`side-e-${app.id}`} className="side e" />
        <div id={`side-s-${app.id}`} className="side s" />
        <div id={`side-w-${app.id}`} className="side w" />
        <div id={`corner-nw-${app.id}`} className="corner nw" />
        <div id={`corner-ne-${app.id}`} className="corner ne" />
        <div id={`corner-se-${app.id}`} className="corner se" />
        <div id={`corner-sw-${app.id}`} className="corner sw" />
      </div>
    )
  }
}
