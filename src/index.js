import 'react-app-polyfill/ie11'
import 'normalize.css'
import './index.scss'

import React from 'react'
import ReactDOM from 'react-dom'

import registerServiceWorker from './registerServiceWorker'
import { useMedia } from './shared/customHooks'
import { mediaSizes } from './shared/shared'
import Display from './components/display/Display'

function App() {
  const isMobile = useMedia([`(min-width: ${mediaSizes.desktop}px)`], [false], true)
  return <Display isMobile={isMobile} />
}

ReactDOM.render(<App />, document.getElementById('root'))
registerServiceWorker()
