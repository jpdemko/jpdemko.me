import { useState } from "react"
import styled from "styled-components/macro"

import { MsgBox } from "../ui/IO"

/* --------------------------------- STYLES --------------------------------- */

const ChatIO = styled(MsgBox)`
	max-height: 40vmin;
	transition: all 0.4s;
	&:focus {
		min-height: calc(var(--nav-height) * 3);
	}
`

/* -------------------------------- COMPONENT ------------------------------- */

function ChatInput({ socketSendRoomMsg, roomsShown, socketSendDM, ...props }) {
	const [text, setText] = useState("")

	function submit(e) {
		e.preventDefault()
		const send = roomsShown ? socketSendRoomMsg : socketSendDM
		send(text)
			.then(() => setText(""))
			.catch((err) => console.error("<ChatInput /> send() error: ", err))
	}

	function handleTextChange(e) {
		setText(e.target.value)
	}

	function checkKeys(e) {
		if (e.keyCode === 13 && !e.shiftKey) submit(e)
	}

	return (
		<form onSubmit={submit} {...props}>
			<ChatIO
				minLength="1"
				required
				value={text}
				onChange={handleTextChange}
				onKeyDown={checkKeys}
				placeholder="Send a message."
			/>
		</form>
	)
}

export default ChatInput
