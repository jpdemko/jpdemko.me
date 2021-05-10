import { useEffect, useRef, useState } from "react"
import styled from "styled-components/macro"

import { MsgBox } from "../ui/io"
import filter from "./filter"

/* --------------------------------- STYLES --------------------------------- */

const InputArea = styled(MsgBox)`
	border-left: none !important;
	border-right: none !important;
	border-bottom: none !important;
	width: 100%;
	height: 100%;
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

function ChatInput({ data, roomsShown, send, ...props }) {
	const [text, setText] = useState("")
	const [error, setError] = useState(null)

	// Need to know last 2 logs for the filter so users can't spell out bad words w/ 1 line 1 char messages.
	const last3LogsRef = useRef([])
	const type = roomsShown ? "msgs" : "dms"
	const logsLength = data?.[type] ? Object.keys(data[type]).length : 0
	useEffect(() => {
		if (!data) return
		let ids = Object.keys(data[type] ?? {}).filter((key) => isNaN(data[type][key]))
		ids = ids.slice(ids.length - 4 < 0 ? 0 : ids.length - 4)
		last3LogsRef.current = ids.map((id) => data[type][id]?.msg)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [logsLength, type])

	// Create a cooldown for onSubmit to prevent spam.
	const lastMsgRef = useRef()

	function submit(e) {
		e.preventDefault()
		// const { isValidText, error: potError }
		let curTextRes = filter.isValidText(text)
		if (curTextRes?.isValidText) {
			const combinedText = last3LogsRef.current?.concat([text]).join("")
			const combinedTextRes = filter.isValidText(combinedText)
			const onCD = Date.now() - lastMsgRef.current < 1000
			if (combinedTextRes?.isValidText) {
				if (onCD) return
				send(text)
					.then(() => {
						lastMsgRef.current = Date.now()
						setText("")
					})
					.catch((err) => console.error("<ChatInput /> submit() error: ", err))
			} else {
				setError(
					"Current input + previous logs, contains or has the potential to contain offensive language."
				)
			}
		} else if (curTextRes?.potError) {
			setError(curTextRes?.potError)
		}
	}

	function handleTextChange(e) {
		if (error) {
			setText(text)
			setError(null)
		} else setText(e.target.value)
	}

	function checkKeys(e) {
		if (e.keyCode === 13 && !e.shiftKey) submit(e)
	}

	return (
		<InputForm onSubmit={submit} {...props}>
			<InputArea
				minLength="1"
				required
				error={error}
				value={text}
				onChange={handleTextChange}
				onKeyDown={checkKeys}
				placeholder="Send a message."
				clearError={setError}
				inset
				maxLength="1000"
			/>
		</InputForm>
	)
}

export default ChatInput
