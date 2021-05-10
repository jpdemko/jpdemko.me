import { Children, cloneElement, useContext } from "react"
import { ThemeContext, ThemeProvider } from "styled-components/macro"

import { themes } from "../../shared/shared"

function ThemeCheck({ setTheme, setColor, children }) {
	const curTheme = useContext(ThemeContext)
	const finTheme = themes?.[setTheme] ?? curTheme

	function getChildren() {
		let output = children
		if (finTheme?.[setColor]) {
			output = Children.map(children, (child) =>
				cloneElement(child, { color: finTheme[setColor], colorContrast: finTheme[`${setColor}Contrast`] })
			)
		}
		return output
	}

	return <ThemeProvider theme={finTheme}>{getChildren()}</ThemeProvider>
}

export default ThemeCheck
