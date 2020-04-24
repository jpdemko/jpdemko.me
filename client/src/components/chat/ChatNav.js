/* eslint-disable jsx-a11y/label-has-associated-control */

import * as React from "react"
import styled, { css } from "styled-components/macro"

import { Contexts } from "../../shared/shared"
import Button from "../ui/Button"
import { Input } from "../ui/IO"
import { ReactComponent as CloseSVG } from "../../shared/assets/icons/close.svg"
import { ReactComponent as ArrowRightSVG } from "../../shared/assets/icons/arrow-right.svg"
import { ReactComponent as UserSVG } from "../../shared/assets/icons/user.svg"

/* --------------------------------- STYLES --------------------------------- */

const DrawerRoot = styled.div`
	--drawer-padding: 0.3em;
	flex: 0 0 auto;
	display: flex;
	flex-direction: column;
	${({ theme, isMobileWindow }) => css`
		border-right: ${isMobileWindow ? "none" : `1px solid ${theme.accent}`};
	`}
`

const List = styled.div`
	flex: 1 1;
	overflow-y: auto;
	overflow-x: hidden;
	padding: var(--drawer-padding);
	> div {
		margin: var(--drawer-padding);
	}
`

const Row = styled.div``

const Room = styled(Button)`
	button {
		height: 100%;
	}
	${({ isFocused }) => css`
		svg {
			transform: rotate(${isFocused ? "90deg" : "0"});
		}
	`}
`

const User = styled(Button)`
	margin-left: calc(var(--drawer-padding) * 6);
`

const Close = styled(Button)`
	margin-left: var(--drawer-padding);
`

const Footer = styled.div`
	flex: 0 0 auto;
	margin-top: auto;
	display: flex;
	button {
		flex: 1 1 auto;
	}
`

const ModalRoot = styled.div`
	--modal-padding: 0.5em;
	min-width: max-content;
	padding: var(--modal-padding) calc(var(--modal-padding) * 2);
	font-size: 1.1em;
	div {
		padding: var(--modal-padding);
	}
	${({ theme }) => css`
		background: ${theme.altBackground};
		border: 1px solid ${theme.accent};
		color: ${theme.contrast};
		span {
			color: ${theme.highlight};
		}
	`}
`

const Empha = styled.span`
	font-weight: 500;
`

/* -------------------------------- COMPONENT ------------------------------- */

function ChatNav({ roomsData, curRoom, joinRoom, leaveRoom, user }) {
	const isMobileWindow = React.useContext(Contexts.IsMobileWindow)
	const { setDrawerContent, setModalContent, toggleModal } = React.useContext(Contexts.AppNav)

	const [roomName, setRoomName] = React.useState("")
	const [roomPassword, setRoomPassword] = React.useState("")

	const inputRef = React.useRef()
	function extendToggleModal() {
		toggleModal(inputRef)
	}

	function submitJoinRoomForm(e) {
		e.preventDefault()
		joinRoom({ name: roomName, password: roomPassword })
			.then((res) => {
				// Probably should change the UI response to errors. Pretty scuffed.
				console.log("joinRoom() from <ChatNav /> success? ", res)
				setRoomName("")
				extendToggleModal()
			})
			.catch((err) => {
				console.log(err)
				setRoomName(err)
				setRoomPassword("")
			})
	}

	function joinPrevRoom(room) {
		joinRoom(room, true).then(console.log).catch(console.log)
	}

	const modalContent = (
		<ModalRoot>
			<form onSubmit={submitJoinRoomForm}>
				<div>
					<Empha>Join room config!</Empha>
					<br />
					If room doesn't exist it will be created.
				</div>
				<div>
					<label>
						<span>Room name:</span>
						<br />
						<Input
							type="text"
							placeholder="Room name required!"
							value={roomName}
							onChange={(e) => setRoomName(e.target.value)}
							required
							minLength="1"
							ref={inputRef}
						/>
					</label>
				</div>
				<div>
					<label>
						<span>Room password:</span>
						<br />
						<Input
							type="password"
							value={roomPassword}
							placeholder="Password field."
							onChange={(e) => setRoomPassword(e.target.value)}
							minLength="6"
						/>
					</label>
				</div>
				<div>
					<Button type="submit" variant="fancy">
						Submit
					</Button>
				</div>
			</form>
		</ModalRoot>
	)
	React.useEffect(() => setModalContent(modalContent))

	const drawerContent = (
		<DrawerRoot>
			<List>
				{roomsData &&
					curRoom &&
					roomsData?.map((r) => (
						<React.Fragment key={r.name}>
							<div>
								<Room
									svg={ArrowRightSVG}
									isFocused={r.name === curRoom.name}
									onClick={() => joinPrevRoom(r)}
								>
									{r.name}
								</Room>
								<Close svg={CloseSVG} color="red" onClick={() => leaveRoom(r.name)} />
							</div>
							{r.name === curRoom.name &&
								curRoom?.users?.map((u) => (
									<div key={u.uid}>
										<User svg={UserSVG} isFocused={u.name === user.name}>
											{u.name}
										</User>
									</div>
								))}
						</React.Fragment>
					))}
			</List>
			<Footer>
				<Button variant="fancy" onClick={extendToggleModal}>
					Join Room
				</Button>
			</Footer>
		</DrawerRoot>
	)
	React.useEffect(() => setDrawerContent(drawerContent))

	return !isMobileWindow && drawerContent
}

export default ChatNav
