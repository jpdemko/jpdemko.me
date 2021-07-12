import styled, { css } from "styled-components/macro"
import { useContext } from "react"

import { Contexts, setupAppSharedOptions, themes } from "../../shared/shared"
import { ReactComponent as SvgSmile } from "../../shared/assets/material-icons/smile.svg"
import imgPortfolioOS from "../../shared/assets/images/PortfolioOS.jpg"
import imgWeather from "../../shared/assets/images/Weather.jpg"
import imgChat from "../../shared/assets/images/Chat.jpg"
import imgMinesweeper from "../../shared/assets/images/Minesweeper.jpg"
import { ReactComponent as SvgGithub } from "../../shared/assets/brands-icons/github.svg"
import { ReactComponent as SvgEmail } from "../../shared/assets/material-icons/email.svg"
import Link from "../ui/Link"
import { Banner } from "../ui/Misc"
import Project from "./Project"

/* --------------------------------- STYLES --------------------------------- */

const ProjList = styled.div`
	> * {
		margin-bottom: var(--content-spacing);
	}
	> div:nth-child(even) {
		flex-direction: row-reverse;
	}
`

const ContactFooter = styled.div``

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
		color: ${theme.backgroundContrast};
		@media (hover) {
			&:hover {
				color: ${theme.highlight};
			}
		}
		&:active {
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
					<div>
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
					</div>
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
					<Project
						title="Minesweeper"
						img={imgMinesweeper}
						tech="HTML,CSS,JavaScript,React,Node,PostgreSQL"
					>
						<p>
							When I was growing up in rural areas, we didn't have the best computers and internet, so
							a lot of the times I played the default computer games that came with Windows. One of my
							favorite games to play was Minesweeper, to this day I still occasionally play it over
							other modern games when I have the time and the itch.
						</p>
						<p>
							Fitting games into the React model is a little awkward, but it was a fun experience
							putting it all together and dealing with performance. I also included a global
							leaderboard, which is nice to see where you stand.
						</p>
						<div className="enpha">Takeaways</div>
						<ul>
							<li>
								Really take a step back and think if the current design caters towards performance,
								because nothing feels worse than a slow and laggy game. Figuring out the best way to
								make the board/cells render as little as possible and dealing with related bugs, eg:
								stale variables from closures due to memoization (for performance benefits) was a
								great learning experience.
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
	theme: themes.blue,
})

export default About
