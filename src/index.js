import 'sanitize.css'
import 'sanitize.css/typography.css'
import 'sanitize.css/forms.css'

import React from 'react'
import ReactDOM from 'react-dom'
import { createGlobalStyle, ThemeProvider } from 'styled-components/macro'

import registerServiceWorker from './registerServiceWorker'
import Contexts from './shared/contexts'
import { useMedia } from './shared/customHooks'
import { themes, mediaBreakpoints } from './shared/shared'
import Display from './components/display/Display'
import Weather from './components/weather/Weather'

const GlobalStyle = createGlobalStyle`
	html {
		font-size: 16px;
		height: 100%;
	}

	body {
		color: ${themes.dark.mainColor};
		height: 100%;
	}

  /* For some reason GSAP Draggable doesn't work in Firefox if base 'svg' properties are set... */
	div svg {
		height: 1.5em;
		width: 1.5em;
	}

	#root {
		height: 100%;
	}
`

const mountableApps = [Weather]

function FakeOS() {
	const isMobileSite = useMedia([`(min-width: ${mediaBreakpoints.desktop}px)`], [false], true)

	return (
		<>
			<GlobalStyle />
			<ThemeProvider theme={themes.dark}>
				<Contexts.MobileSite.Provider value={isMobileSite}>
					<Display isMobileSite={isMobileSite} mountableApps={mountableApps} />
				</Contexts.MobileSite.Provider>
			</ThemeProvider>
		</>
	)
}

ReactDOM.render(<FakeOS />, document.getElementById('root'))
registerServiceWorker()
