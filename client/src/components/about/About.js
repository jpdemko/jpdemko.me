import styled, { css } from "styled-components/macro"
import { useContext } from "react"

import { Contexts, setupAppSharedOptions } from "../../shared/shared"
import { ReactComponent as SvgSmile } from "../../shared/assets/material-icons/smile.svg"
import imgPortfolioOS from "../../shared/assets/images/PortfolioOS.jpg"
import imgWeather from "../../shared/assets/images/Weather.jpg"
import imgChat from "../../shared/assets/images/Chat.jpg"
import { ReactComponent as SvgGithub } from "../../shared/assets/brands-icons/github.svg"
import { ReactComponent as SvgEmail } from "../../shared/assets/material-icons/email.svg"
import Link from "../ui/Link"
import Project from "./Project"

/* --------------------------------- STYLES --------------------------------- */

const ProjList = styled.div`
	> div:nth-child(even) {
		flex-direction: row-reverse;
	}
	> * {
		margin: var(--content-spacing) 0;
	}
`

const ContactFooter = styled.div``

const Banner = styled.div`
	line-height: 1;
	text-transform: uppercase;
	font-weight: bold;
	font-size: 2em;
	padding: 0.1em 0.2em;
	${({ theme }) => css`
		background: ${theme.highlight};
		color: ${theme.background};
	`}
`

const Root = styled.div``

const MainSection = styled.section``

const Intro = styled.div`
	font-size: 1.5em;
`

const NameRow = styled.div``

const IntroLinks = styled.div`
	> * {
		margin-right: calc(var(--content-spacing) / 2);
	}
`

export const LogoLink = styled(Link)`
	background: none;
	${({ theme }) => css`
		color: ${theme.bgContrast};
		&:hover {
			color: ${theme.highlight};
		}
	`}
`

/* -------------------------------- COMPONENT ------------------------------- */

function About({ title, ...props }) {
	const { isMobileWindow } = useContext(Contexts.Window)

	return (
		<Root {...props} isMobileWindow={isMobileWindow}>
			<MainSection>
				<Intro>
					<NameRow>
						Hello, my name is <span className="enpha">Preston Demko</span>.
					</NameRow>
					<div>
						I'm a <span className="enpha">full-stack</span> developer based in San Antonio.
					</div>
					<IntroLinks>
						<LogoLink href="https://github.com/jpdemko">
							<SvgGithub />
						</LogoLink>
						<LogoLink href="mailto:prestondemko@gmail.com">
							<SvgEmail />
						</LogoLink>
					</IntroLinks>
				</Intro>
				<Banner>Projects</Banner>
				<ProjList>
					<Project
						title="Portfolio OS"
						img={imgPortfolioOS}
						tech="HTML,CSS,JavaScript,React,Node"
						github="https://github.com/jpdemko/jpdemko.me"
					>
						<p>
							When I decided to make a portfolio, I wanted to have fun and do something a little
							different. Instead of traditional portfolios whose projects redirect the user outside the
							site, this project allows users to see and interact with them as 'programs' right away.
						</p>
						<div className="enpha">Takeaways</div>
						<ul>
							<li>
								Dealing w/ odd browser engine bugs; such as blurriness of an element's children when
								that parent element has dimensional subpixel values (eg: 453.241px) on WebKit/Blink.
							</li>
							<li>Animating w/ React can be quirky.</li>
						</ul>
					</Project>
					<Project
						title="Chat"
						img={imgChat}
						imgPosition="left center"
						tech="HTML,CSS,JavaScript,React,Node,PostgreSQL"
					>
						<p>
							This app allows users to create public/private rooms to chat, as well as being able to
							privately DM eachother. Currently I have it setup where users need to quickly sign-in w/
							Google/GitHub OAuth (via PassportJS) to use this app, but I might change that in the
							future.
						</p>
						<p>
							The goal of this project was to get more experience in back-end development; setting up
							ExpressJS w/ auth protected areas and getting a PostreSQL database running so users won't
							lose or miss data.
						</p>
						<div className="enpha">Takeaways</div>
						<ul>
							<li>
								Really taking your time to make sure all the SQL/PSQL you write will work and make
								sense is very important. Making changes to tables w/ lots of data in them is not fun.
							</li>
							<li>
								Make sure to validate data exchanged between the client and server so there is no
								chance of misinterpreted data or bad hand-offs.
							</li>
						</ul>
					</Project>
					<Project title="Weather" img={imgWeather} tech="HTML,CSS,JavaScript,React,Node">
						<p>
							This was my first app for Portfolio OS, it gathers and combines data from different APIs
							around the internet for a pleasant user experience that you'd want out of a Weather app.
						</p>
						<p>Big thanks to these public APIs so I could make this app:</p>
						<ul>
							<li>
								Sun data from <Link href="https://sunrise-sunset.org/">Sunrise Sunset</Link>
							</li>
							<li>
								Forecast data from <Link href="https://darksky.net/">Dark Sky</Link>
							</li>
							<li>
								Map from{" "}
								<Link href="https://www.microsoft.com/en-us/maps/choose-your-bing-maps-api">
									Microsoft Bing Maps
								</Link>
							</li>
							<li>
								Map radar images overlay from{" "}
								<Link href="https://mesonet.agron.iastate.edu/">
									Iowa State Univ. Environmental Mesonet
								</Link>
							</li>
						</ul>
						<div className="enpha">Takeaways</div>
						<ul>
							<li>
								API changes can break your app so it's important to create mappings so any changes can
								be fixed easier.
							</li>
							<li>
								Have to be careful when dealing with dates and timezones so you don't pull your hair
								out! It helps to use a date library like LuxonJS.
							</li>
						</ul>
					</Project>
				</ProjList>
				<ContactFooter>
					<p>
						If you're interested in working together,{" "}
						<Link href="mailto:prestondemko@gmail.com">shoot me an e-mail</Link>. Also be sure to{" "}
						<Link href="https://github.com/jpdemko/jpdemko.me">check out my GitHub</Link> if you want to
						see the source code of this project or any of the others.
					</p>
				</ContactFooter>
			</MainSection>
		</Root>
	)
}

About.shared = setupAppSharedOptions({
	title: "About",
	logo: SvgSmile,
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
