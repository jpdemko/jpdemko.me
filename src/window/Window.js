import './window.scss'
import Helpers from '../util/helpers'
import { Draggable, TweenLite } from 'gsap/all'
import React from 'react'

/*
resize
*/

// chrome webkit bug causes blurry text/images on child elements upon parent 3d transform.
// flag to disable 3d transforms in chrome for component
const isChrome = !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime)

let numInstances = 0
let zIndexLeader = 999

export default class Window extends React.Component {
  constructor(props) {
    super(props)
    this.id = ++numInstances
    this.mql = window.matchMedia('(min-width: 700px)')
    this.state = {
      isDesktop: this.mql.matches,
      zIndex: ++zIndexLeader
    }
  }

  componentDidMount() {
    const id = this.id
    const zIndexUpdate = this.zIndexUpdate
    const windowRef = document.getElementById(`window-${id}`)
    this.windowRef = windowRef

    this.windowDraggable = new Draggable(windowRef, {
      force3D: isChrome ? false : true,
      bounds: '.display',
      edgeResistance: 0.5,
      trigger: `#window-bar-${id}`,
      zIndexBoost: false,
      onPress: zIndexUpdate
    })

    const genResizeDraggable = (target, vars) =>
      new Draggable(target, {
        ...vars,
        onPress: () => {
          zIndexUpdate()
          this.windowDraggable.disable()
        },
        onRelease: () => this.windowDraggable.enable()
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

    this.mql.addListener(this.switchLayout)
    this.switchLayout()
  }

  componentWillUnmount() {
    this.dragInstances.forEach(i => i.kill())
    this.mql.removeListener(this.switchLayout)
  }

  zIndexUpdate = () => {
    if (this.state.zIndex !== zIndexLeader) this.setState({ zIndex: ++zIndexLeader })
  }

  switchLayout = (mql = this.mql) => {
    if (mql.matches && !this.state.isDesktop) {
      const { width, height, x, y } = this.latestDesktopValues
      TweenLite.to(this.windowRef, 0.5, { width: width, height: height, x: x, y: y })
      this.dragInstances.forEach(i => i.enable())
      this.setState({ isDesktop: true })
    } else if (!mql.matches) {
      this.latestDesktopValues = {
        width: Helpers.getStyleProperty(this.windowRef, 'width', true),
        height: Helpers.getStyleProperty(this.windowRef, 'height', true),
        x: this.windowDraggable.x,
        y: this.windowDraggable.y
      }
      this.dragInstances.forEach(i => i.disable())
      TweenLite.to(this.windowRef, 0.5, { width: '100%', height: '100%', x: 0, y: 0, top: 0 })
      this.setState({ isDesktop: false })
    }
  }

  render() {
    let id = this.id
    return (
      <div id={`window-${id}`} className="window" style={{ zIndex: this.state.zIndex }}>
        <div id={`window-bar-${id}`} className="window-bar" />
        <div className="content-overflow-fix">
          <div className="content" onClick={this.zIndexUpdate}>
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
