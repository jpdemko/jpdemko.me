import './window.css'

import React from 'react'
import styled from 'styled-components/macro'
import { Draggable, TweenLite } from 'gsap/all'

import QueryBreakpoints from '../../shared/QueryBreakpoints'
import WindowTitleBar from './children/WindowTitleBar'
import { getStyleProperty } from '../../shared/helpers'

// <-- START of STYLED-COMPONENTS -->
const Window = styled.div`
  position: absolute;
  display: flex;
  flex-direction: column;

  @media (min-width: ${QueryBreakpoints.desktop}px) {
    border: 0.1rem solid rgba(0, 0, 0, 0.5);
    /* Filter looks great, but seems to cause performance issues w/ lots of windows open */
    /* filter: drop-shadow(0 0 0.2rem rgba(0, 0, 0, 0.5)); */
  }
`

const ContentWrap = styled.div`
  overflow-y: auto;
  flex: 1;
`
// <-- END of STYLED-COMPONENTS -->

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
    isMaximized: this.props.isMobile,
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
        trigger: `#n-side-${id}, #nw-corner-${id}, #ne-corner-${id}`,
        cursor: 'n-resize',
        onDrag: function() {
          TweenLite.set(windowRef, { height: `-=${this.deltaY}`, y: `+=${this.deltaY}` })
        }
      }),
      genResizeDraggable(document.createElement('div'), {
        trigger: `#e-side-${id}, #ne-corner-${id}, #se-corner-${id}`,
        cursor: 'e-resize',
        onDrag: function(e) {
          TweenLite.set(windowRef, { width: `+=${this.deltaX}` })
        }
      }),
      genResizeDraggable(document.createElement('div'), {
        trigger: `#s-side-${id}, #sw-corner-${id}, #se-corner-${id}`,
        cursor: 's-resize',
        onDrag: function() {
          TweenLite.set(windowRef, { height: `+=${this.deltaY}` })
        }
      }),
      genResizeDraggable(document.createElement('div'), {
        trigger: `#w-side-${id}, #nw-corner-${id}, #sw-corner-${id}`,
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
      <Window id={`window-${id}`} style={{ zIndex: this.state.zIndex, left: xOrigin, top: yOrigin }}>
        <WindowTitleBar
          id={id}
          title={title}
          isMaximized={this.state.isMaximized}
          minimize={this.minimize}
          restore={this.restore}
          maximize={this.maximize}
          close={close}
        />
        <div className="content-overflow-fix">
          <div className="content" onClick={this.zIndexUpdate}>
            {this.props.children}
          </div>
        </div>
        <div id={`n-side-${id}`} className="side n-side" />
        <div id={`e-side-${id}`} className="side e-side" />
        <div id={`s-side-${id}`} className="side s-side" />
        <div id={`w-side-${id}`} className="side w-side" />
        <div id={`nw-corner-${id}`} className="corner nw-corner" />
        <div id={`ne-corner-${id}`} className="corner ne-corner" />
        <div id={`se-corner-${id}`} className="corner se-corner" />
        <div id={`sw-corner-${id}`} className="corner sw-corner" />
      </Window>
    )
  }
}
