import React from 'react'
import ReactDOM from 'react-dom'

import 'normalize.css'

import registerServiceWorker from './registerServiceWorker'
import Weather from './weather/Weather'

ReactDOM.render(<Weather />, document.getElementById('root'))
registerServiceWorker()
