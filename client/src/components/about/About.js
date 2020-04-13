import React from "react"
import styled, { css } from "styled-components/macro"

import { createTheme, setupAppSharedOptions } from "../../shared/shared"
import { ReactComponent as SmileSVG } from "../../shared/assets/icons/smile.svg"
import Link from "../ui/Link"

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div``

const MainSection = styled.section`
	font-size: 1.35em;
	max-width: 1024px;
	max-width: 70ch;
	margin: 0 auto;
	padding: 1em;
	> * {
		margin: 0 0 1em 0;
	}
	p:last-child {
		margin: 0;
	}
`

const Title = styled.h3`
	font-family: sans-serif;
`

const Para = styled.p`
	font-family: serif;
`

const Enpha = styled.span`
	${({ theme }) => css`
		color: ${theme.highlight};
	`}
`

/* -------------------------------- COMPONENT ------------------------------- */

function About({ ...props }) {
	return (
		<Root {...props}>
			<MainSection>
				<Title>
					Hello, my name is <Enpha>Preston Demko</Enpha>.<br />
					I'm an aspiring <Enpha>full-stack</Enpha> developer based in San Antonio.
				</Title>
				<Para>
					This website is an ongoing collection of projects I've made to push myself and learn new
					things. I've encapsulated it all into the fun concept of an 'OS' with apps/programs for each
					project.
				</Para>
				<Para>
					If you're interested in working together,{" "}
					<Link href="mailto:prestondemko@gmail.com">shoot me an e-mail</Link>. Also be sure to{" "}
					<Link href="https://github.com/jpdemko/jpdemko.me">check out my GitHub</Link> if you want to
					see the source code of this project or any of the others.
				</Para>
			</MainSection>
		</Root>
	)
}

About.shared = setupAppSharedOptions({
	title: "About",
	logo: SmileSVG,
	theme: createTheme("about", {
		altBackground: "#DEE2E1",
		background: "#F4F9F7",
		contrast: "#204234",
		highlight: "#1BDC8C",
		color: "#1BDC8C",
		accent: "#17B573",
		contrastOptions: ["#204234", "#F4F9F7"],
	}),
})

export default About
