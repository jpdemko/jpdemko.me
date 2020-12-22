import "sanitize.css"
import "sanitize.css/typography.css"
import "sanitize.css/forms.css"

import { useState, useEffect } from "react"
import ReactDOM from "react-dom"
import { createGlobalStyle, ThemeProvider } from "styled-components/macro"

import { useLocalStorage, useMedia } from "./shared/hooks"
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
		max-width: 100%;
		max-height: 100%;
		height: 100%;
		width: auto;
		overflow: hidden;
	}

	#root {
		height: 100%;
		.chLimit {
			max-width: 35ch;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
	}
`

/* -------------------------------- COMPONENT ------------------------------- */

function PortfolioOS() {
	const isMobileSite = useMedia([`(min-width: ${mediaBreakpoints.desktop}px)`], [false], true)
	const [tabHidden, setTabHidden] = useState(document.hidden)
	const [theme, setTheme] = useLocalStorage("PortfolioOS-Theme", "blue", true)

	// function handleVisibChange() {
	// 	setTabHidden(document.hidden)
	// }

	// useEffect(() => {
	// 	document.addEventListener("visibilitychange", handleVisibChange, false)
	// 	return () => document.removeEventListener("visibilitychange", handleVisibChange, false)
	// }, [])

	return (
		<>
			<GlobalStyle />
			<ThemeProvider theme={themes[theme]}>
				<AuthProvider>
					<Contexts.PortfolioOS.Provider value={{ tabHidden, setTheme }}>
						<Display isMobileSite={isMobileSite} tabHidden={tabHidden} />
					</Contexts.PortfolioOS.Provider>
				</AuthProvider>
			</ThemeProvider>
		</>
	)
}

ReactDOM.render(<PortfolioOS />, document.getElementById("root"))

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals()
