import { useContext } from "react"
import styled, { css } from "styled-components/macro"

import { Contexts } from "../../shared/shared"
import Link from "../ui/Link"

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	flex-direction: column;
`

/* -------------------------------- COMPONENT ------------------------------- */

function SocialLogin() {
	const authContext = useContext(Contexts.Auth)

	return (
		<Root>
			<Link openNewTab={false} trustedLink={true} href="/auth/google">
				Login w/ Google
			</Link>
		</Root>
	)
}

export default SocialLogin
