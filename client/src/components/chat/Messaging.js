import React from "react"
import styled, { css } from "styled-components/macro"

import Logs from "./Logs"
import IO from "./IO"

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div`
	flex: 1 1;
	display: flex;
	flex-direction: column;
`

/* -------------------------------- COMPONENT ------------------------------- */

function Messaging({ curRoom, sendMsg, user, ...props }) {
	return (
		<Root {...props}>
			<Logs curRoom={curRoom} user={user} />
			<IO sendMsg={sendMsg} disabled={!!!curRoom} />
		</Root>
	)
}

export default Messaging
