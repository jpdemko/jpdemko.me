import 'react-app-polyfill/ie11'
import 'react-app-polyfill/stable'
import 'sanitize.css'

import React from 'react'
import ReactDOM from 'react-dom'
import { createGlobalStyle } from 'styled-components/macro'

import registerServiceWorker from './registerServiceWorker'
import { useMedia } from './shared/customHooks'
import { mediaBreakpoints } from './shared/variables'
import Display from './components/display/Display'

const GlobalStyle = createGlobalStyle`
	html {
		font-size: 20px;
	}
`

function App() {
  const isMobile = useMedia([`(min-width: ${mediaBreakpoints.desktop}px)`], [false], true)

  return (
    <>
      <GlobalStyle />
      <Display isMobile={isMobile} />
    </>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
registerServiceWorker()
