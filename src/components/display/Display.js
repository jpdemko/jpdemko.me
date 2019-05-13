// TODO - Figure out how to make navigation that works in mobile/desktop.
// Also add a way to close apps from navigation in both mobile/desktop.

import React from 'react'
import styled from 'styled-components/macro'

import Window from './Window'
import Weather from '../weather/Weather'
import { windowCSS } from '../../shared/variables'
import { getStyleProperty } from '../../shared/helpers'

const Display = styled.div`
  height: 100vh;
  position: relative;
  overflow: hidden;
`

// Actual Window components use this wireframe's calculated px dimensions for their opening animation.
// Trying to animate the actual Windows when they have set % CSS applied doesn't give the desired resizing effect.
const WindowWireframe = styled.div`
  position: absolute;
  z-index: -5000;
  top: 50%;
  left: 50%;
  opacity: 0;
  transform: translate(-50%, -50%);
  min-width: ${windowCSS.minWidth}px;
  width: 70%;
  min-height: ${windowCSS.minHeight}px;
  height: 50%;
`

const Shortcuts = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`

const Navigation = styled.div`
  position: fixed;
  bottom: 0;
  z-index: 5000;
`

const installedApps = [Weather]
let uniqueID = 0

export default class extends React.Component {
  state = { openedApps: [] }
  recentlyMinimizedApps = []

  componentDidUpdate(prevProps) {
    if (prevProps.isMobile !== this.props.isMobile) {
      this.state.openedApps.forEach(app => {
        // MAYBE - Possibly save state of Window to go back to on layout return?
        const wdow = app.windowRef.current
        if (this.props.isMobile) {
          if (wdow.isOnTop()) wdow.maximize()
          else wdow.minimize(['skipFocusBelowWindow'])
        } else wdow.restore()
      })
    }
  }

  openApp = (e, component) => {
    // SyntheticEvent will be reused (properties will be set to null), so I need to copy the desired...
    // ...value or use `e.persist()`.
    const shortcut = e.target
    this.setState(prevState => ({
      openedApps: [
        ...prevState.openedApps,
        {
          id: ++uniqueID,
          windowRef: React.createRef(),
          component,
          // GROSS - Having to use different syntax for each button element origin. Is there a better way?
          origins: { shortcut, navigationRef: React.createRef() },
        },
      ],
    }))
  }

  closeApp = id => {
    this.setState(prevState => ({ openedApps: prevState.openedApps.filter(app => app.id !== id) }))
  }

  // Mimics Win10 desktop toggle.
  toggleDesktop = () => {
    if (this.recentlyMinimizedApps.length > 0) {
      this.recentlyMinimizedApps.forEach(app => app.windowRef.current.restore(['skipMoveOnTop']))
      this.recentlyMinimizedApps = []
    } else {
      this.state.openedApps.forEach(app => {
        if (!app.windowRef.current.state.isMinimized) {
          this.recentlyMinimizedApps.push(app)
          app.windowRef.current.minimize(['skipFocusBelowWindow', 'skipMoveOnTop'])
        }
      })
    }
  }

  focusBelowWindow = curApp => {
    if (this.state.openedApps.length < 1) return
    const curZ = getStyleProperty(curApp.elementRef.current, 'z-index', true)
    const belowApp = this.state.openedApps.reduce((acc, next) => {
      const accZ = getStyleProperty(acc.windowRef.current.elementRef.current, 'z-index', true)
      const nextZ = getStyleProperty(next.windowRef.current.elementRef.current, 'z-index', true)
      return nextZ > accZ && nextZ < curZ ? next : acc
    })
    belowApp.windowRef.current.moveOnTop()
  }

  render() {
    return (
      <>
        <Display id="display">
          <Shortcuts>
            {installedApps.map(app => (
              <button key={app.title} onClick={e => this.openApp(e, app)}>
                {app.title}
              </button>
            ))}
          </Shortcuts>
          <Navigation>
            <button onClick={this.toggleDesktop}>desktop</button>
            {this.state.openedApps.map(app => (
              <button
                key={app.id}
                ref={app.origins.navigationRef}
                onClick={() => app.windowRef.current.toggleMinimize()}
              >
                {app.component.title}
              </button>
            ))}
          </Navigation>
          <WindowWireframe id="window-wireframe" />
          {this.state.openedApps.map(app => (
            <Window
              key={app.id}
              ref={app.windowRef}
              app={app}
              closeApp={this.closeApp}
              isMobile={this.props.isMobile}
              focusBelowWindow={this.focusBelowWindow}
            >
              <app.component />
            </Window>
          ))}
        </Display>
      </>
    )
  }
}
