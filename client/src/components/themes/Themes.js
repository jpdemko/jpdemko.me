import { useContext } from "react"
import styled from "styled-components/macro"

import { themes, setupAppSharedOptions, Contexts } from "../../shared/shared"
import { ReactComponent as SvgPalette } from "../../shared/assets/material-icons/palette.svg"
import { ReactComponent as SvgWrench } from "../../shared/assets/material-icons/wrench.svg"
import Button from "../ui/Button"

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div``

const MainSection = styled.section``

const Construction = styled.div`
	svg {
		margin: 0 1em;
		&:first-child {
			margin-left: 0;
		}
	}
`

const BtnGroup = styled.div`
	display: flex;
	flex-wrap: wrap;
`

const ThemeBtn = styled(Button)`
	text-transform: uppercase;
	font-size: 1.2em;
	margin: 0 var(--content-spacing) var(--content-spacing) 0;
`

/* -------------------------------- COMPONENT ------------------------------- */

function Themes({ title, ...props }) {
	const { setTheme } = useContext(Contexts.PortfolioOS)
	const { isMobileWindow } = useContext(Contexts.Window)

	return (
		<Root {...props} isMobileWindow={isMobileWindow}>
			<MainSection>
				<Construction className="enpha">
					<SvgWrench /> Under construction! <SvgWrench />
				</Construction>
				<div className="enpha">Pre-made themes: </div>
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
			</MainSection>
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
