import 'sanitize.css'
import 'sanitize.css/typography.css'
import 'sanitize.css/forms.css'

import React from 'react'
import ReactDOM from 'react-dom'
import { createGlobalStyle, ThemeProvider } from 'styled-components/macro'
import { Router } from 'react-router-dom'
import { createBrowserHistory } from 'history'

import registerServiceWorker from './registerServiceWorker'
import { useMedia } from './shared/customHooks'
import { themes, mediaBreakpoints, Contexts } from './shared/shared'
import Display from './components/display/Display'
import Weather from './components/weather/Weather'
import About from './components/about/About'
import Chat from './components/chat/Chat'

const GlobalStyle = createGlobalStyle`
	html {
		font-size: 16px;
		height: 100%;
	}

	body {
		color: ${themes.dark.mainColor};
		height: 100%;
	}

	svg:not(:root) {
		height: 100%;
		width: auto;
		overflow: hidden;
	}

	#root {
		height: 100%;
	}
`

const history = createBrowserHistory()

const mountableApps = [About, Weather, Chat]

function FakeOS() {
	const isMobileSite = useMedia([`(min-width: ${mediaBreakpoints.desktop}px)`], [false], true)

	return (
		<>
			<GlobalStyle />
			<Contexts.IsMobileSite.Provider value={isMobileSite}>
				<ThemeProvider theme={themes.dark}>
					<Router history={history}>
						<Display isMobileSite={isMobileSite} mountableApps={mountableApps} />
					</Router>
				</ThemeProvider>
			</Contexts.IsMobileSite.Provider>
		</>
	)
}

ReactDOM.render(<FakeOS />, document.getElementById('root'))
registerServiceWorker()