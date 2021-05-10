import styled, { css } from "styled-components/macro"

import TechIcons from "./mappedTechIcons"
import { ReactComponent as SvgGithub } from "../../shared/assets/brands-icons/github.svg"
import { LogoLink } from "./About"

/* --------------------------------- STYLES --------------------------------- */

const ProjImgRoot = styled.div`
	flex: 1 0 160px;
	min-height: 160px;
	overflow: hidden;
`

const ProjImg = styled.div`
	background-size: cover;
	background-repeat: no-repeat;
	height: 100%;
	transition: transform 0.5s;
	${({ img, imgPosition = "center" }) => css`
		background-position: ${imgPosition};
		background-image: url(${img});
	`}
`

const ProjRoot = styled.div`
	display: flex;
	flex-wrap: wrap;
	@media (hover) {
		&:hover ${ProjImg} {
			transform: scale(1.05);
		}
	}
	${({ theme }) => css`
		background: ${theme.backgroundAlt};
		border-top: 1px solid ${theme.accent};
	`}
`

const ProjTitle = styled.div`
	font-size: 1.25em;
	display: flex;
	justify-content: space-between;
`

const ProjTech = styled.div`
	display: flex;
	flex-flow: row wrap;
	> span {
		flex: 0 0 auto;
		margin-right: calc(var(--content-spacing) / 2);
	}
	> div {
		flex: 1 0 auto;
		display: flex;
		> * {
			margin-right: calc(var(--content-spacing) / 4);
		}
		> *:last-child {
			margin-right: 0;
		}
	}
`

const ProjInfo = styled.div`
	flex: 2 0 320px;
	padding: 0 var(--content-spacing);
	> div {
		margin-top: calc(var(--content-spacing) * 0.75);
	}
	> div:last-child {
		margin-bottom: calc(var(--content-spacing) * 0.75);
	}
`

/* -------------------------------- COMPONENT ------------------------------- */

function Project({ title, img, imgPosition, tech = "", github, children, ...props }) {
	return (
		<ProjRoot {...props}>
			<ProjImgRoot>
				<ProjImg img={img} imgPosition={imgPosition} />
			</ProjImgRoot>
			<ProjInfo>
				<ProjTitle>
					<span className="enpha">{title}</span>
					{github && (
						<LogoLink href={github}>
							<SvgGithub />
						</LogoLink>
					)}
				</ProjTitle>
				{children}
				<ProjTech>
					<span className="enpha">Tech</span>
					<div>
						<span>[</span>
						{tech.split(",").map((t) => {
							const TechIcon = TechIcons[t]
							return TechIcon ? <TechIcon key={t} title={t} /> : null
						})}
						<span>]</span>
					</div>
				</ProjTech>
			</ProjInfo>
		</ProjRoot>
	)
}

export default Project
