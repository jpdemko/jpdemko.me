import 'react-app-polyfill/ie11'
import 'normalize.css'
import './index.scss'

import React, { useState } from 'react'
import ReactDOM from 'react-dom'

import registerServiceWorker from './registerServiceWorker'
import { useMedia } from './shared/customHooks'
import { mediaSizes, durations } from './shared/shared'
import Window from './components/window/Window'
import Weather from './components/weather/Weather'

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

function App() {
  const [openedApps, setOpenedApps] = useState([])
  const isMobile = useMedia([`(min-width: ${mediaSizes.desktop}px)`], [false], true)

  const openApp = (e, App) => {
    const origin = { x: isMobile ? 0 : e.clientX, y: isMobile ? 0 : e.clientY }
    setOpenedApps(prevApps => [
      ...prevApps,
      {
        id: ++uniqueID,
        component: App,
        isMinimized: false,
        origin
      }
    ])
  }

  const closeApp = id => setOpenedApps(prevApps => prevApps.filter(app => app.id !== id))

  const toggleMinimize = id =>
    setOpenedApps(prevApps => {
      const nextApps = [...prevApps]
      const app = nextApps.find(appData => appData.id === id)
      app.isMinimized = !app.isMinimized
      return nextApps
    })

  const toggleDesktop = () =>
    setOpenedApps(prevApps => {
      const nextApps = [...prevApps]
      const numMinimized = nextApps.reduce((acc, appData) => acc + (appData.isMinimized ? 1 : 0), 0)
      const majority = numMinimized <= nextApps.length / numMinimized
      nextApps.forEach(appData => (appData.isMinimized = majority))
      return nextApps
    })

  return (
    <>
      <div className="display">
        <div className="shortcuts">
          {installedApps.map(component => (
            <button key={component.title} onClick={e => openApp(e, component)}>
              {component.title}
            </button>
          ))}
        </div>
        {openedApps.map(appData => (
          <Window
            key={appData.id}
            appData={appData}
            isMinimized={appData.isMinimized}
            isMobile={isMobile}
            toggleMinimize={toggleMinimize}
            closeApp={closeApp}
          >
            <appData.component />
          </Window>
        ))}
        <div className="navigation">
          <button onClick={toggleDesktop}>desktop</button>
          {openedApps.map(appData => (
            <button key={appData.id} onClick={() => toggleMinimize(appData.id)}>
              {appData.component.title}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
registerServiceWorker()
