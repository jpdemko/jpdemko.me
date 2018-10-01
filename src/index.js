import React from 'react'
import ReactDOM from 'react-dom'
import Weather from './weather/Weather'
import registerServiceWorker from './registerServiceWorker'

const App = () => (
  <React.Fragment>
    <Weather />
  </React.Fragment>
)

ReactDOM.render(<App />, document.getElementById('root'))
registerServiceWorker()
