import * as React from "react"
import styled, { css } from "styled-components/macro"

import { MsgBox } from "../ui/IO"

/* --------------------------------- STYLES --------------------------------- */

/* -------------------------------- COMPONENT ------------------------------- */

function IO({ send, ...props }) {
	const [text, setText] = React.useState("")

	function submitMsg(e) {
		e.preventDefault()
		send(text)
			.then(() => setText(""))
			.catch((err) => console.log("IO send message error.", err))
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

export default IO
