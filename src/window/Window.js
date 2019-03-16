import './window.scss'
import Util from '../lib/util'
import { Draggable, TweenLite } from 'gsap/all'
import React from 'react'

// Chrome WebKit bug causes blurry text/images on child elements upon parent 3D transform.
// This is a flag to disable 3D transforms in Chrome for Window components.
const isChrome = !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime)

// GSAP's Draggable has a built in z-index updater, but we disable it and update z-index
// manually since it doesn't do exactly what we want.
let zIndexLeader = 999

const animationsDuration = 0.4

export default class Window extends React.Component {
  state = { zIndex: ++zIndexLeader }

  componentDidMount() {
    const id = this.props.id
    const windowRef = document.getElementById(`window-${id}`)
    this.windowRef = windowRef

    this.windowDraggable = new Draggable(windowRef, {
      force3D: isChrome ? false : true,
      bounds: '.display',
      edgeResistance: 0.5,
      trigger: `#window-bar-${id}`,
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
  }

  shouldComponentUpdate(nextProps) {
    return this.props.isMobile !== nextProps.isMobile
  }

  componentWillUnmount() {
    this.dragInstances.forEach(i => i.kill())
  }

  componentDidUpdate() {
    this.updateLayout()
  }

  setLastPosition = () => {
    const { width, height } = this.windowRef.getBoundingClientRect()
    this.lastPosition = {
      top: Util.getStyleProperty(this.windowRef, 'top', true),
      left: Util.getStyleProperty(this.windowRef, 'left', true),
      x: this.windowDraggable.x,
      y: this.windowDraggable.y,
      width,
      height
    }
  }

  updateLayout = () => {
    if (this.props.isMobile) {
      this.maximize()
    } else if (this.lastPosition) {
      this.restore()
    }
  }

  maximize = () => {
    this.setLastPosition()
    TweenLite.to(this.windowRef, animationsDuration, {
      top: 0,
      left: 0,
      x: 0,
      y: 0,
      width: '100%',
      height: '100%'
    })
  }

  restore = () => {
    TweenLite.to(this.windowRef, animationsDuration, {
      top: this.lastPosition.top,
      left: this.lastPosition.left,
      width: this.lastPosition.width,
      height: this.lastPosition.height,
      x: this.lastPosition.x,
      y: this.lastPosition.y
    })
  }

  zIndexUpdate = () => {
    if (this.state.zIndex !== zIndexLeader) this.setState({ zIndex: ++zIndexLeader })
  }

  render() {
    const { id, xOrigin, yOrigin } = this.props
    return (
      <div
        id={`window-${id}`}
        className="window"
        style={{ zIndex: this.state.zIndex, left: xOrigin, top: yOrigin }}
      >
        <div id={`window-bar-${id}`} className="window-bar" />
        <div className="content-overflow-fix">
          <div className="content" onClick={this.zIndexUpdate}>
            <button onClick={() => console.log(this.windowDraggable)}>print draggable info</button>
            <button onClick={() => console.log(this.windowRef.getBoundingClientRect())}>
              print bound rect
            </button>
            {this.props.children}
            <p>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Vitae sed dolore debitis amet,
              quibusdam molestiae blanditiis. Numquam aut inventore laudantium repellendus commodi eaque
              est eveniet odio illo nam labore molestiae laboriosam ducimus vero architecto esse rem,
              nihil atque sunt molestias.
            </p>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit. Quidem molestiae, maiores
              deserunt eligendi saepe similique. Laudantium, iure. Alias consectetur ipsum recusandae
              velit, voluptas hic eos vel, reprehenderit, blanditiis laboriosam beatae soluta vero
              nesciunt. Accusantium repellendus sit quisquam laudantium! Tenetur non, quod fuga, esse,
              sunt incidunt perspiciatis impedit nemo sed quaerat fugiat illum quam dolore voluptatem id
              nulla? Perferendis, ut libero?
            </p>
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
      </div>
    )
  }
}
