import React from "react"
import styled, { css, ThemeProvider } from "styled-components/macro"

import { Contexts, themes } from "../../shared/shared"
import Button from "../ui/Button"

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div`
	flex: 0 1 auto;
	display: flex;
	flex-direction: column;
	height: 100%;
	${({ theme }) => css``}
`

const RoomList = styled.div`
	flex: 1 1 auto;
`

const Footer = styled.div`
	flex: 0 0 auto;
	margin-top: auto;
`

const ModalRoot = styled.div`
	min-width: max-content;
	padding: 1em;
	${({ theme }) => css``}
`

/* -------------------------------- COMPONENT ------------------------------- */

function ChatNav({ roomsData, joinRoom }) {
	const isMobileWindow = React.useContext(Contexts.IsMobileWindow)
	const { setDrawerContent, toggleMobileMenu, setModalContent, toggleModal } = React.useContext(
		Contexts.AppNav
	)

	const [roomName, setRoomName] = React.useState("")
	const [roomPassword, setRoomPassword] = React.useState("")

	function submitJoinRoomForm(e) {
		e.preventDefault()
		joinRoom({ name: roomName, password: roomPassword }, true)
			.then((res) => {
				// Probably should change the UI response to errors. Pretty scuffed.
				console.log("joinRoom() from ChatNav: ", res)
				setRoomName("")
				toggleModal()
			})
			.catch((err) => {
				console.log(err)
				setRoomName(err)
				setRoomPassword("")
			})
	}

	const modalContent = (
		<ModalRoot>
			<form onSubmit={submitJoinRoomForm}>
				<div>
					Join room config!
					<br />
					If room doesn't exist it will be created.
				</div>
				<div>
					<label>
						Room name:
						<br />
						<input
							type="text"
							placeholder="Room name required!"
							value={roomName}
							onChange={(e) => setRoomName(e.target.value)}
							required
							minLength="1"
						/>
					</label>
				</div>
				<div>
					<label>
						Room password:
						<br />
						<input
							type="password"
							value={roomPassword}
							placeholder="Password field."
							onChange={(e) => setRoomPassword(e.target.value)}
							minLength="6"
						/>
					</label>
				</div>
				<div>
					<input type="submit" value="Submit" />
				</div>
			</form>
		</ModalRoot>
	)

	const drawerContent = (
		<Root>
			<RoomList>
				{Array.isArray(roomsData) && roomsData.map((room) => <div key={room.name}>{room.name}</div>)}
			</RoomList>
			<Footer>
				{/* <Button variant="fancy" color="blue" onClick={toggleModal}> */}
				<Button variant="fancy" onClick={toggleModal}>
					Join Room
				</Button>
			</Footer>
		</Root>
	)

	React.useEffect(() => {
		setModalContent(modalContent)
		setDrawerContent(drawerContent)
	}, [modalContent, drawerContent, setDrawerContent, setModalContent])

	return !isMobileWindow && drawerContent
}

export default ChatNav
