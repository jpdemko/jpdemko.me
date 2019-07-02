import 'sanitize.css'
import 'sanitize.css/typography.css'
import 'sanitize.css/forms.css'

import React from 'react'
import ReactDOM from 'react-dom'
import { createGlobalStyle } from 'styled-components/macro'

import registerServiceWorker from './registerServiceWorker'
import { useMedia } from './shared/customHooks'
import { sharedCSS } from './shared/variables'
import Display from './components/display/Display'
import Weather from './components/weather/Weather'

const GlobalStyle = createGlobalStyle`
	html {
		font-size: 16px;
	}

	body {
		color: #333;
	}

	svg {
		width: 1.5em;
		height: 1.5em;
	}
`

const mountableApps = [Weather]

function FakeOS() {
	const isMobile = useMedia([`(min-width: ${sharedCSS.media.desktop}px)`], [false], true)

	return (
		<>
			<GlobalStyle />
			<Display isMobile={isMobile} mountableApps={mountableApps} />
		</>
	)
}

ReactDOM.render(<FakeOS />, document.getElementById('root'))
registerServiceWorker()
