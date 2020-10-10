import * as React from "react"

import { MsgBox } from "../ui/IO"

/* --------------------------------- STYLES --------------------------------- */

/* -------------------------------- COMPONENT ------------------------------- */

function ChatInput({ socketSendRoomMsg, roomsShown, ...props }) {
	const [text, setText] = React.useState("")

	function submitMsg(e) {
		e.preventDefault()
		socketSendRoomMsg(text)
			.then(() => setText(""))
			.catch((err) => console.error("ChatInput send room message error: ", err))
	}

	function handleTextChange(e) {
		setText(e.target.value)
	}

	function checkKeys(e) {
		if (e.keyCode === 13 && !e.shiftKey) submitMsg(e)
	}

	return (
		<form onSubmit={submitMsg}>
			<MsgBox
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
