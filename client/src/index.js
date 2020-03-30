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
import { themes, mediaBreakpoints, Contexts } from "./shared/constants"
import Display from "./components/display/Display"
import AuthProvider from "./components/auth/AuthProvider"

/* --------------------------------- STYLES --------------------------------- */

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

/* -------------------------------- COMPONENT ------------------------------- */

const history = createBrowserHistory()

function FakeOS() {
	const isMobileSite = useMedia([`(min-width: ${mediaBreakpoints.desktop}px)`], [false], true)
	//TODO: try and fix themeing across the app, looks ugly
	return (
		<>
			<GlobalStyle />
			<ThemeProvider theme={themes.dark}>
				<Router history={history}>
					<AuthProvider>
						<Contexts.Settings.Provider value={isMobileSite}>
							<Display isMobileSite={isMobileSite} />
						</Contexts.Settings.Provider>
					</AuthProvider>
				</Router>
			</ThemeProvider>
		</>
	)
}

ReactDOM.render(<FakeOS />, document.getElementById("root"))

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// https://bit.ly/CRA-PWA
serviceWorker.unregister()
