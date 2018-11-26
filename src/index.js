import 'react-app-polyfill/ie11'

import React from 'react'
import ReactDOM from 'react-dom'
import registerServiceWorker from './registerServiceWorker'

import 'normalize.css'

import Weather from './weather/Weather'

ReactDOM.render(<Weather />, document.getElementById('root'))
registerServiceWorker()
