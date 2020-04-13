import "sanitize.css"
import "sanitize.css/typography.css"
import "sanitize.css/forms.css"

import React from "react"
import ReactDOM from "react-dom"
import { createGlobalStyle, ThemeProvider } from "styled-components/macro"
import { Router } from "react-router-dom"
import { createBrowserHistory } from "history"

import * as serviceWorker from "./serviceWorker"
import { useMedia } from "./shared/hooks"
import { themes, mediaBreakpoints } from "./shared/shared"
import Display from "./components/display/Display"
import AuthProvider from "./components/auth/AuthProvider"

/* --------------------------------- STYLES --------------------------------- */

const GlobalStyle = createGlobalStyle`
	html {
		font-size: 16px;
		height: 100%;
	}

	body {
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

/* -------------------------------- COMPONENT ------------------------------- */

const history = createBrowserHistory()

function FakeOS() {
	const isMobileSite = useMedia([`(min-width: ${mediaBreakpoints.desktop}px)`], [false], true)

	return (
		<>
			<GlobalStyle />
			<ThemeProvider theme={themes.blue}>
				<Router history={history}>
					<AuthProvider>
						<Display isMobileSite={isMobileSite} />
					</AuthProvider>
				</Router>
			</ThemeProvider>
		</>
	)
}

ReactDOM.render(<FakeOS />, document.getElementById("root"))

// Work offline and load faster? I can change unregister() to register()... https://bit.ly/CRA-PWA
serviceWorker.unregister()
