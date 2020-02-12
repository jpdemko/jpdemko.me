import React from 'react'
import styled from 'styled-components/macro'
import socketIOClient from 'socket.io-client'

import { addTheme } from '../../shared/shared'
import { ReactComponent as ChatSVG } from '../../shared/assets/material-icons/chat.svg'

const Root = styled.div`
	background: salmon;
`

function Chat() {
	const [inputText, setInputText] = React.useState('')
	const [serverMsg, setServerMsg] = React.useState('')
	const socketRef = React.useRef()

	React.useEffect(() => {
		socketRef.current = socketIOClient(process.env.REACT_APP_HOME_URL)

		socketRef.current.on('reverse', ({ msg }) => {
			setServerMsg(msg)
		})

		return () => {
			socketRef.current.disconnect()
		}
	}, [])

	function sendMsg(msg) {
		socketRef.current.emit('sendMsg', msg)
	}

	function handleSubmit(e) {
		e.preventDefault()
		sendMsg(inputText)
		setInputText('')
	}

	function handleInputChange(e) {
		setInputText(e.target.value)
	}

	return (
		<Root>
			<form onSubmit={handleSubmit}>
				<label>
					msg: <input type='text' value={inputText} onChange={handleInputChange} />
				</label>
				<input type='submit' value='Submit' />
			</form>
			<div>socket msg: {serverMsg}</div>
		</Root>
	)
}

Chat.shared = {
	title: 'Chat',
	logo: ChatSVG,
	theme: addTheme('chat', {
		mainColor: '#e00b89',
		altColor: '#ffb439',
		gradient: 'linear-gradient(45deg, #e00b89 15%, #ffb439 95%)',
	}),
}

export default Chat
