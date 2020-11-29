import { useState } from "react"
import styled from "styled-components/macro"

import { MsgBox } from "../ui/IO"

/* --------------------------------- STYLES --------------------------------- */

const InputArea = styled(MsgBox)`
	border-left: none;
	border-right: none;
	border-bottom: none;
`

const InputForm = styled.form`
	transition: all 0.3s;
	display: block;
	flex: 0 0;
	max-height: 40%;
	&:focus-within {
		flex: 0 0 calc(var(--nav-height) * 3);
	}
`

/* -------------------------------- COMPONENT ------------------------------- */

function ChatInput({ send, ...props }) {
	const [text, setText] = useState("")

	function log() {
		console.log("<ChatInput /> ", arguments)
	}

	function submit(e) {
		e.preventDefault()
		send(text)
			.then(() => setText(""))
			.catch((err) => log("send() error: ", err))
	}

	function handleTextChange(e) {
		setText(e.target.value)
	}

	function checkKeys(e) {
		if (e.keyCode === 13 && !e.shiftKey) submit(e)
	}

	return (
		<InputForm onSubmit={submit} {...props}>
			<InputArea
				minLength="1"
				required
				value={text}
				onChange={handleTextChange}
				onKeyDown={checkKeys}
				placeholder="Send a message."
			/>
		</InputForm>
	)
}

export default ChatInput
