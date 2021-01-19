import { useContext } from "react"
import styled, { css, ThemeContext } from "styled-components/macro"

import { themes, setupAppSharedOptions, Contexts } from "../../shared/shared"
import { ReactComponent as SvgPalette } from "../../shared/assets/material-icons/palette.svg"
import Button from "../ui/Button"

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div``

const BtnGroup = styled.div`
	display: flex;
	flex-wrap: wrap;
`

const ThemeBtn = styled(Button)`
	text-transform: uppercase;
	font-size: 1.2em;
	margin: 0.5em;
`

/* -------------------------------- COMPONENT ------------------------------- */

function Themes({ ...props }) {
	const curTheme = useContext(ThemeContext)
	const { setTheme } = useContext(Contexts.PortfolioOS)

	return (
		<Root>
			<div>Choose theme: </div>
			<BtnGroup>
				{Object.keys(themes).map((title) => {
					return (
						<ThemeBtn
							key={title}
							variant="fancy"
							setTheme={title}
							onClick={() => setTheme(title)}
							setColor="primary"
						>
							{title}
						</ThemeBtn>
					)
				})}
			</BtnGroup>
		</Root>
	)
}

Themes.shared = setupAppSharedOptions({
	title: "Themes",
	logo: SvgPalette,
	theme: {
		name: "purple",
		altBackground: "#EDE9F2",
		background: "#F7F5FA",
		bgContrast: "#312653",
		highlight: "#6637D6",
		primary: "#6637D6",
		primaryContrast: "#F7F5FA",
		accent: "#8956FF",
	},
})

export default Themes
