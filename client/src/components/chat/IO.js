import React from "react"
import styled, { css } from "styled-components/macro"

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div``

/* -------------------------------- COMPONENT ------------------------------- */

function IO({ sendMsg, disabled, ...props }) {
	const [text, setText] = React.useState("")

	function submitMsg(e) {
		e.preventDefault()
		if (disabled) return
		sendMsg(text)
		setText("")
	}

	function handleTextChange(e) {
		setText(e.target.value)
	}

	function checkKeys(e) {
		if (e.keyCode === 13 && !e.shiftKey) submitMsg(e)
	}

	return (
		<form onSubmit={submitMsg}>
			<textarea minLength="1" required value={text} onChange={handleTextChange} onKeyDown={checkKeys} />
		</form>
	)
}

export default IO
