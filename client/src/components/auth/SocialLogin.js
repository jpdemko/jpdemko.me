import styled from "styled-components/macro"

import { ReactComponent as SvgGoogle } from "../../shared/assets/brands-icons/google.svg"
import { ReactComponent as SvgGitHub } from "../../shared/assets/brands-icons/github.svg"
import Button from "../ui/Button"

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div``

const MainSection = styled.section``

const OAuthLink = styled(Button)`
	margin: 0 var(--content-spacing) var(--content-spacing) 0 !important;
	text-decoration: none;
	font-weight: bold;
`

const Info = styled.div`
	font-size: 1.2em;
`

const Why = styled.div`
	font-size: 1.1.em;
`

const Reasoning = styled.div``

const LinkGroup = styled.div``

/* -------------------------------- COMPONENT ------------------------------- */

function SocialLogin({ reason, ...props }) {
	return (
		<Root {...props}>
			<MainSection>
				<Info>This app requires a quick sign-in to use!</Info>
				{reason && (
					<>
						<Why className="enpha">Why?</Why>
						<Reasoning>{reason}</Reasoning>
					</>
				)}
				<LinkGroup>
					<OAuthLink
						tag="a"
						href="/auth/google"
						svg={SvgGoogle}
						variant="fancy"
						setTheme="red"
						setColor="highlight"
					>
						Fast login w/ Google
					</OAuthLink>
					<OAuthLink
						tag="a"
						href="/auth/github"
						svg={SvgGitHub}
						variant="fancy"
						setTheme="green"
						setColor="highlight"
					>
						Fast login w/ GitHub
					</OAuthLink>
				</LinkGroup>
			</MainSection>
		</Root>
	)
}

export default SocialLogin
