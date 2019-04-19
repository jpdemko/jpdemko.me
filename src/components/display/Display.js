import React from 'react'

import Window from '../window/Window'
import Weather from '../weather/Weather'

const Placeholder = props => (
  <>
    <div>
      Lorem ipsum, dolor sit amet consectetur adipisicing elit. Dolore, totam beatae error praesentium,
      enim molestiae laudantium dolores cupiditate nam adipisci perspiciatis odit maiores tenetur.
      Magnam, qui reprehenderit veritatis, atque, velit repellendus quaerat quae laboriosam facilis enim
      aperiam ea dolor asperiores?
    </div>
    <div>
      Lorem ipsum dolor sit amet consectetur adipisicing elit. Placeat soluta recusandae dolorem nostrum
      delectus, illo laudantium vel id! Iste tempore perspiciatis itaque quidem, fugiat ab aperiam!
      Minima harum deserunt iure eligendi enim totam, autem reiciendis minus cumque quaerat. Praesentium
      soluta perferendis totam laboriosam quis nihil, optio suscipit eaque neque ducimus molestias?
      Eligendi placeat vero laudantium dicta in labore temporibus! Ad?
    </div>
  </>
)

Placeholder.title = 'Placeholder'

const installedApps = [Placeholder, Weather]
let uniqueID = 0

class Display extends React.Component {
  state = { openedApps: [] }

  openApp = (e, app) => {
    const origin = { x: this.props.isMobile ? 0 : e.clientX, y: this.props.isMobile ? 0 : e.clientY }
    this.setState(prevState => ({
      openedApps: [
        ...prevState.openedApps,
        {
          id: ++uniqueID,
          window: React.createRef(),
          component: app,
          origin
        }
      ]
    }))
  }

  closeApp = id => {
    this.setState(prevState => ({ openedApps: prevState.openedApps.filter(app => app.id !== id) }))
  }

  toggleApp = id => {
    const app = this.state.openedApps.find(app => app.id === id)
    if (app.window.current.state.isMinimized) {
      app.window.current.restore()
      app.window.current.zIndexUpdate()
    } else app.window.current.minimize()
  }

  toggleDesktop = () => {
    const numMinimized = this.state.openedApps.reduce(
      (acc, app) => (acc + app.window.current.state.isMinimized ? 1 : 0),
      0
    )
    const method = numMinimized > this.state.openedApps.length / numMinimized ? 'restore' : 'minimize'
    this.state.openedApps.forEach(app => app.window.current[method]())
  }

  render() {
    return (
      <>
        <div className="display">
          <div className="shortcuts">
            {installedApps.map(component => (
              <button key={component.title} onClick={e => this.openApp(e, component)}>
                {component.title}
              </button>
            ))}
          </div>
          {this.state.openedApps.map(app => (
            <Window
              key={app.id}
              ref={app.window}
              app={app}
              closeApp={this.closeApp}
              isMobile={this.props.isMobile}
            >
              <app.component />
            </Window>
          ))}
          <div className="navigation">
            <button onClick={this.toggleDesktop}>desktop</button>
            {this.state.openedApps.map(app => (
              <button key={app.id} onClick={() => this.toggleApp(app.id)}>
                {app.component.title}
              </button>
            ))}
          </div>
        </div>
      </>
    )
  }
}

export default Display
