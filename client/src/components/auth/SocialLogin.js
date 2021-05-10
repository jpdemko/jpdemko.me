import { useContext } from "react"
import styled, { css } from "styled-components/macro"

import { ReactComponent as SvgGoogle } from "../../shared/assets/brands-icons/google.svg"
import { ReactComponent as SvgGitHub } from "../../shared/assets/brands-icons/github.svg"
import Button from "../ui/Button"
import { Contexts } from "../../shared/shared"

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div`
	${({ theme, isMobileWindow }) => css`
		background: ${theme.backgroundAlt};
		${!isMobileWindow &&
		css`
			display: flex;
			justify-content: center;
			align-items: center;
		`}
	`}
`

const MainSection = styled.section`
	max-width: 65ch !important;
	${({ theme, isMobileWindow }) =>
		!isMobileWindow &&
		css`
			border: 1px solid ${theme.accent};
			background: ${theme.background};
		`}
`

const OAuthLink = styled(Button)`
	text-decoration: none;
	font-weight: bold;
`

const Info = styled.div`
	font-size: 1.2em;
`

const Why = styled.div`
	font-size: 1.1em;
`

const Reasoning = styled.div``

const LinkGroup = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	margin-top: calc(-1 * var(--content-spacing)) !important;
	> * {
		margin: var(--content-spacing) var(--content-spacing) 0 0;
		flex: 0 1 auto;
	}
`

/* -------------------------------- COMPONENT ------------------------------- */

function SocialLogin({ reason, ...props }) {
	const { isBanned } = useContext(Contexts.Auth)
	const { isMobileWindow } = useContext(Contexts.Window)

	return (
		<Root {...props} isMobileWindow={isMobileWindow}>
			<MainSection isMobileWindow={isMobileWindow}>
				{isBanned ? (
					<div className="enpha" style={{ fontSize: "2em" }}>
						YOU ARE BANNED :)
					</div>
				) : (
					<>
						<Info>This app requires a quick sign-in to use!</Info>
						{reason && (
							<div>
								<Why className="enpha">Why?</Why>
								<Reasoning>{reason}</Reasoning>
							</div>
						)}
						<LinkGroup>
							<OAuthLink
								tag="a"
								href="/auth/google"
								svg={SvgGoogle}
								variant="solid"
								setTheme="red"
								setColor="highlight"
							>
								Fast login w/ Google
							</OAuthLink>
							<OAuthLink
								tag="a"
								href="/auth/github"
								svg={SvgGitHub}
								variant="solid"
								setTheme="green"
								setColor="highlight"
							>
								Fast login w/ GitHub
							</OAuthLink>
						</LinkGroup>
					</>
				)}
			</MainSection>
		</Root>
	)
}

export default SocialLogin
