import React from 'react'
import styled, { css } from 'styled-components/macro'

import { addTheme, themes } from '../../shared/shared'
import { ReactComponent as SmileSVG } from '../../shared/assets/material-icons/smile.svg'
import Link from '../ui/Link'

/* --------------------------------- STYLES --------------------------------- */

const Background = styled.div`
	${({ theme }) => css`
		background: ${theme.contrastColor};
	`}
`

const Root = styled.section`
	font-size: 1.25em;
	max-width: 1024px; /* Fallback. */
	max-width: 75ch;
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
	${({ color }) => css`
		color: ${color};
	`}
`

/* -------------------------------- COMPONENT ------------------------------- */

const About = ({ ...props }) => {
	return (
		<Background {...props}>
			<Root>
				<Title>
					Hello, my name is <Enpha color={themes.about.mainColor}>Preston Demko</Enpha>.<br />
					I'm an aspiring <Enpha color={themes.about.altColor}>full-stack</Enpha> developer based in San
					Antonio.
				</Title>
				<Para>
					This website is an ongoing collection of projects I've made to push myself and learn new things.
					I've encapsulated it all into the fun concept of an 'OS' with apps/programs for each project.
				</Para>
				<Para>
					If you're interested in working together,{' '}
					<Link href='mailto:prestondemko@gmail.com'>shoot me an e-mail</Link>. Also be sure to{' '}
					<Link href='https://github.com/jpdemko/jpdemko.me'>check out my GitHub</Link> if you want to see the
					source code of this project or any of the others.
				</Para>
			</Root>
		</Background>
	)
}

About.shared = {
	title: 'About',
	logo: SmileSVG,
	theme: addTheme('about', {
		mainColor: '#2bcbec',
		altColor: '#7fd245',
		gradient: 'linear-gradient(45deg, #2bcbec 30%, #7fd245 100%)',
	}),
}

export default About
