import 'react-app-polyfill/ie11'
import 'normalize.css'
import './index.scss'

import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import registerServiceWorker from './registerServiceWorker'

import Window from './window/Window'
import CustomHooks from './lib/customHooks'

const Placeholder = props => <div>{`content#${props.id} isMobile: ${props.isMobile}`}</div>

let windowInstances = 0
function App() {
  const isMobile = CustomHooks.useMedia(['(min-width: 700px)'], [false], true)
  const [apps, setApps] = useState([])

  const addApp = (e, jsx) => {
    const xOrigin = e.clientX
    const yOrigin = e.clientY
    setApps(prevApps => [...prevApps, { id: ++windowInstances, jsx, xOrigin, yOrigin }])
  }

  return (
    <div className="display">
      <button onClick={e => addApp(e, <Placeholder />)}>ADD TOMATO</button>
      <div style={{ marginTop: '50vh' }}>
        <button onClick={e => addApp(e, <Placeholder />)}>ADD STEAK</button>
      </div>
      {apps.map(app => (
        <Window key={app.id} id={app.id} isMobile={isMobile} xOrigin={app.xOrigin} yOrigin={app.yOrigin}>
          {React.cloneElement(app.jsx, { id: app.id, isMobile })}
        </Window>
      ))}
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
registerServiceWorker()
