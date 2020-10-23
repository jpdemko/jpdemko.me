import "sanitize.css"
import "sanitize.css/typography.css"
import "sanitize.css/forms.css"

import { useState, useEffect } from "react"
import ReactDOM from "react-dom"
import { createGlobalStyle, ThemeProvider } from "styled-components/macro"
import { Router } from "react-router-dom"
import { createBrowserHistory } from "history"

import { useMedia } from "./shared/hooks"
import { themes, mediaBreakpoints, Contexts } from "./shared/shared"
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
	const [tabHidden, setTabHidden] = useState(document.hidden)

	function handleVisibChange() {
		setTabHidden(document.hidden)
	}

	useEffect(() => {
		document.addEventListener("visibilitychange", handleVisibChange, false)
		return () => document.removeEventListener("visibilitychange", handleVisibChange, false)
	}, [])

	return (
		<>
			<GlobalStyle />
			<ThemeProvider theme={themes.blue}>
				<Router history={history}>
					<AuthProvider>
						<Contexts.TabHidden.Provider value={tabHidden}>
							<Display isMobileSite={isMobileSite} tabHidden={tabHidden} />
						</Contexts.TabHidden.Provider>
					</AuthProvider>
				</Router>
			</ThemeProvider>
		</>
	)
}

ReactDOM.render(<FakeOS />, document.getElementById("root"))

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals()
