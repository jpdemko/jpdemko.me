import "sanitize.css"
import "sanitize.css/typography.css"
import "sanitize.css/forms.css"

import { useState, useEffect } from "react"
import ReactDOM from "react-dom"
import { createGlobalStyle, ThemeProvider } from "styled-components/macro"

import { useLocalStorage, useMediaQuery } from "./shared/hooks"
import { themes, mediaBreakpoints, Contexts } from "./shared/shared"
import Display from "./components/display/Display"
import AuthProvider from "./components/auth/AuthProvider"

import Roboto from "./shared/assets/fonts/Roboto-Regular.ttf"
import RobotoB from "./shared/assets/fonts/Roboto-Bold.ttf"
import RobotoI from "./shared/assets/fonts/Roboto-Italic.ttf"
import RobotoBI from "./shared/assets/fonts/Roboto-BoldItalic.ttf"

/* --------------------------------- STYLES --------------------------------- */

const GlobalStyle = createGlobalStyle`
	@font-face {
		font-family: "Roboto";
		src: local('Roboto') url(${Roboto}) format("truetype");
		font-weight: 400;
		font-style: normal;
		vertical-align: baseline;
	}

	@font-face {
		font-family: "Roboto";
		src: local('Roboto-Italic') url(${RobotoI}) format("truetype");
		font-weight: 400;
		font-style: italic;
		vertical-align: baseline;
	}

	@font-face {
		font-family: "Roboto";
		src: local('Roboto-Bold') url(${RobotoB}) format("truetype");
		font-weight: 700;
		font-style: normal;
		vertical-align: baseline;
	}

	@font-face {
		font-family: "Roboto";
		src: local('Roboto-BoldItalic') url(${RobotoBI}) format("truetype");
		font-weight: 700;
		font-style: italic;
		vertical-align: baseline;
	}

	html, body {
		height: 100%;
		margin: 0;
		padding: 0;
	}

	html {
		font-size: 16px;
		box-sizing: border-box;
	}

	*, *::before, *::after {
		box-sizing: border-box;
	}

	body {
		font-family: 'Roboto', sans-serif;
	}

	svg:not(:root) {
		max-width: 100%;
		max-height: 100%;
		width: auto;
		overflow: hidden;
	}

	textarea,
	input[type] {
		-webkit-appearance: none !important;
		border-radius: 0 !important;
	}

	#root {
		height: 100%;
		overflow: hidden;

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
	const isDesktop = useMediaQuery(`(min-width: ${mediaBreakpoints.desktop}px)`)

	const [theme, setTheme] = useLocalStorage("PortfolioOS-Theme", "blue", true)

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
			<ThemeProvider theme={themes[theme]}>
				<AuthProvider>
					<Contexts.PortfolioOS.Provider value={{ tabHidden, setTheme }}>
						<Display isMobileSite={!isDesktop} tabHidden={tabHidden} />
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
