import React from "react"
import styled, { css } from "styled-components/macro"

import { Contexts } from "../../shared/shared"

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	flex-direction: column;
`

/* -------------------------------- COMPONENT ------------------------------- */

function SocialLogin() {
	const authContext = React.useContext(Contexts.Auth)

	return (
		<Root>
			<a href="/auth/google">normal anchor link login</a>
		</Root>
	)
}

export default SocialLogin
