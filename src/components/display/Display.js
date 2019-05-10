// TODO - Figure out how to make navigation that works in mobile/desktop.
// Also add a way to close apps from navigation in both mobile/desktop.

import React from 'react'
import styled from 'styled-components/macro'

import Window from '../window/Window'
import Weather from '../weather/Weather'
import { windowCSS } from '../../shared/variables'

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

  componentDidUpdate(prevProps) {
    if (prevProps.isMobile !== this.props.isMobile) {
      this.state.openedApps.forEach(app => {
        // MAYBE - Possibly save state of Window to go back to on layout return?
        const wdow = app.window.current
        if (this.props.isMobile) wdow[wdow.isOnTop() ? 'maximize' : 'minimize']()
        else wdow.restore()
      })
    }
  }

  openApp = (e, component) => {
    // SyntheticEvent will be reused (properties will be set to null) so I need to copy the desired value or use `e.persist()`.
    const shortcut = e.target
    this.setState(prevState => ({
      openedApps: [
        ...prevState.openedApps,
        {
          id: ++uniqueID,
          window: React.createRef(),
          component,
          // GROSS - Having to use different syntax for each button element origin. Is there a better way?
          origins: { shortcut, navigation: React.createRef() },
        },
      ],
    }))
  }

  closeApp = id => {
    this.setState(prevState => ({ openedApps: prevState.openedApps.filter(app => app.id !== id) }))
  }

  toggleDesktop = () => {
    const numMinimized = this.state.openedApps.reduce(
      (acc, app) => acc + (app.window.current.state.isMinimized ? 1 : 0),
      0,
    )
    const method = numMinimized > this.state.openedApps.length / 2 ? 'restore' : 'minimize'
    this.state.openedApps.forEach(app => app.window.current[method]())
  }

  focusWindowBelow = curApp => {
    const belowApp = this.state.openedApps.reduce((acc, cur) => {
      const accZ = acc.window.current.state.zIndex
      const curZ = cur.window.current.state.zIndex
      return curZ > accZ && curZ < curApp.state.zIndex ? cur : acc
    })
    belowApp.window.current.moveOnTop()
  }

  render() {
    return (
      <>
        <Display id="display">
          <Shortcuts>
            {installedApps.map(component => (
              <button key={component.title} onClick={e => this.openApp(e, component)}>
                {component.title}
              </button>
            ))}
          </Shortcuts>
          <Navigation>
            <button onClick={this.toggleDesktop}>desktop</button>
            {this.state.openedApps.map(app => (
              <button
                key={app.id}
                ref={app.origins.navigation}
                onClick={() => app.window.current.toggleMinimize()}
              >
                {app.component.title}
              </button>
            ))}
          </Navigation>
          <WindowWireframe id="window-wireframe" />
          {this.state.openedApps.map(app => (
            <Window
              key={app.id}
              ref={app.window}
              app={app}
              closeApp={this.closeApp}
              isMobile={this.props.isMobile}
              focusWindowBelow={this.focusWindowBelow}
            >
              <app.component />
            </Window>
          ))}
        </Display>
      </>
    )
  }
}
