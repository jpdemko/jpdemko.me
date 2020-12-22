import styled, { css } from "styled-components/macro"

import { Contexts, setupAppSharedOptions } from "../../shared/shared"
import { ReactComponent as SmileSVG } from "../../shared/assets/icons/smile.svg"
import Link from "../ui/Link"
import { useContext } from "react"

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div``

const MainSection = styled.section`
	--about-spacing: 2rem;
	font-size: 1.25em;
	max-width: 1024px;
	margin: 0 auto;
	padding: 0 var(--about-spacing);
	> div {
		margin: var(--about-spacing) 0;
	}
`

const Intro = styled.div`
	font-size: 1.25em;
`

const Project = styled.div``

const Contact = styled.div``

const Enpha = styled.span`
	font-weight: bold;
	${({ theme }) => css`
		color: ${theme.highlight};
	`}
`

const BannerBG = styled.div`
	display: flex;
	align-items: center;
	${({ theme }) => css`
		background: ${theme.highlight};
		color: ${theme.background};
	`}
	> div {
		line-height: 1;
		text-transform: uppercase;
		font-weight: bold;
		font-size: 2em;
		display: inline-block;
		transform: scale(1.5) translate(4px, -2px);
		transform-origin: left center;
	}
`

/* -------------------------------- COMPONENT ------------------------------- */

function Banner(props) {
	return (
		<BannerBG>
			<div>{props.children}</div>
		</BannerBG>
	)
}

function About({ ...props }) {
	const { isMobileWindow } = useContext(Contexts.Window)

	return (
		<Root {...props}>
			<MainSection>
				<Intro>
					Hello, my name is <Enpha>Preston Demko</Enpha>.{isMobileWindow ? " " : <br />}
					I'm a <Enpha>full-stack</Enpha> developer based in San Antonio.
				</Intro>
				<Banner>Projects</Banner>
				<Project>
					<p>
						When I decided to make a portfolio, I wanted to have fun and do something a little
						different. Instead of traditional portfolios whose projects redirect the user outside the
						site, this project allows users to see and interact with things as 'programs' right away.
					</p>
				</Project>
				<Contact>
					<p>
						If you're interested in working together,{" "}
						<Link href="mailto:prestondemko@gmail.com">shoot me an e-mail</Link>. Also be sure to{" "}
						<Link href="https://github.com/jpdemko/jpdemko.me">check out my GitHub</Link> if you want to
						see the source code of this project or any of the others.
					</p>
				</Contact>
			</MainSection>
		</Root>
	)
}

About.shared = setupAppSharedOptions({
	title: "About",
	logo: SmileSVG,
	theme: {
		name: "green",
		altBackground: "#E4EEEB",
		background: "#F4F9F7",
		bgContrast: "#204234",
		highlight: "#1BDC8C",
		primary: "#1BDC8C",
		primaryContrast: "#F4F9F7",
		accent: "#17B573",
	},
})

export default About
