import React from "react"
import styled, { css } from "styled-components/macro"

/* --------------------------------- STYLES --------------------------------- */

const LogsRoot = styled.div`
	flex: 1 1;
	display: flex;
	flex-direction: column;
	padding: 1em;
	> div {
		margin-bottom: 1em;
	}
	> div:last-child {
		margin-bottom: 0;
	}
`

const MsgRoot = styled.div`
	max-width: 80%;
	${({ theme, authored }) => css`
		align-self: ${authored ? "flex-end" : "flex-start"};
	`}
`

const Content = styled.div`
	border-radius: 0.25em;
	padding: 0.25em 0.5em;
	${({ theme }) => css`
		border: 1px solid black;
	`}
`
const Info = styled.div``

/* ------------------------------- COMPONENTS ------------------------------- */

function Msg({ msg, authored, ...props }) {
	const { author: uid, username, mid, message, msg_created_at } = msg
	if (!mid) return null
	return (
		<MsgRoot {...props} authored={authored}>
			<Content>{message}</Content>
			<Info>
				{username} / {msg_created_at}
			</Info>
		</MsgRoot>
	)
}

function Logs({ curRoom, user, ...props }) {
	return (
		<LogsRoot>
			{curRoom &&
				curRoom.msgs.map((msg) => <Msg key={msg.mid} msg={msg} authored={user.uid === msg.author} />)}
		</LogsRoot>
	)
}

export default Logs
