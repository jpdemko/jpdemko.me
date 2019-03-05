import 'react-app-polyfill/ie11'
import 'normalize.css'
import './index.scss'

import React, { useState } from 'react'
import ReactDOM from 'react-dom'
import registerServiceWorker from './registerServiceWorker'

import Window from './window/Window'

function App() {
  const [apps, setApps] = useState([])

  const addApp = () => setApps([...apps, <Window key={new Date().valueOf()} />])

  return (
    <div className="display">
      <button onClick={addApp}>ADD APP</button>
      {apps}
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
registerServiceWorker()
