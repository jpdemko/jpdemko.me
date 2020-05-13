/* eslint-disable jsx-a11y/label-has-associated-control */

import * as React from "react"
import styled, { css } from "styled-components/macro"

import { Contexts } from "../../shared/shared"
import Button from "../ui/Button"
import Modal from "../ui/Modal"
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
	div {
		padding: var(--modal-padding);
	}
	${({ theme }) => css`
		background: ${theme.altBackground};
		border: 1px solid ${theme.accent};
		color: ${theme.contrast};
	`}
`

const Data = styled.div`
	display: inline-flex;
	align-items: center;
`

const Empha = styled.span`
	font-weight: 500;
`

const Lessen = styled.span`
	margin-left: 0.9em;
	opacity: 0.8;
	font-weight: 400;
	font-size: 0.8em;
`

/* -------------------------------- COMPONENT ------------------------------- */

function ChatNav({ roomsData, curRoom, createRoom, joinRoom, leaveRoom, user }) {
	const isMobileWindow = React.useContext(Contexts.IsMobileWindow)
	const { setDrawerContent } = React.useContext(Contexts.AppNav)

	const [rname, setRName] = React.useState("")
	const [password, setPassword] = React.useState("")
	const [rid, setRID] = React.useState("")

	const [modalShown, setModalShown] = React.useState(false)
	const [createConfig, setCreateConfig] = React.useState(true)

	const createRoomModalRef = React.useRef()
	const createRoomModal = (
		<ModalRoot>
			<form onSubmit={submitCreateRoom}>
				<div>
					<Empha>Create room config!</Empha>
				</div>
				<div>
					<label>
						<span>Room name:</span>
						<br />
						<Input
							type="text"
							placeholder="Room name required..."
							value={rname}
							onChange={(e) => setRName(e.target.value)}
							minLength="1"
							required
							ref={createRoomModalRef}
						/>
					</label>
				</div>
				<div>
					<label>
						<span>Room password:</span>
						<br />
						<Input
							type="password"
							placeholder="Optional room password..."
							value={password}
							onChange={(e) => setPassword(e.target.value)}
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

	const joinRoomModalRef = React.useRef()
	const joinRoomModal = (
		<ModalRoot>
			<form onSubmit={submitJoinRoom}>
				<div>
					<Empha>Join room config!</Empha>
				</div>
				<div>
					<label>
						<span>Join room ID#:</span>
						<br />
						<Input
							type="text"
							placeholder="Room ID# required..."
							value={rid}
							onChange={(e) => setRID(e.target.value)}
							minLength="1"
							required
							ref={joinRoomModalRef}
						/>
					</label>
				</div>
				<div>
					<label>
						<span>Does target room have password?</span>
						<br />
						<Input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
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

	function togCreateRoomModal() {
		setCreateConfig(true)
		setModalShown(true)
	}
	function togJoinRoomModal() {
		setCreateConfig(false)
		setModalShown(true)
	}

	React.useEffect(() => {
		if (modalShown) {
			const ref = createConfig ? createRoomModalRef : joinRoomModalRef
			if (ref.current) ref.current.focus()
		}
	}, [createConfig, modalShown])

	function submitJoinRoom(e) {
		e.preventDefault()
		const checkRID = rid ? Number.parseInt(rid) : rid
		let vars = { rid: checkRID, password: password?.length < 6 ? null : password }
		// console.log("submitRoom() vars: ", vars)
		joinRoom(vars)
			.then(() => setModalShown(false))
			.catch(console.log)
			.finally(() => {
				setRID("")
				setPassword("")
			})
	}

	function submitCreateRoom(e) {
		e.preventDefault()
		createRoom({ rname, password: password?.length < 6 ? null : password })
			.then(() => setModalShown(false))
			.catch(console.log)
			.finally(() => {
				setRName("")
				setPassword("")
			})
	}

	function joinPrevRoom(room) {
		joinRoom(room).then(console.log).catch(console.log)
	}

	const drawerContent = (
		<DrawerRoot>
			<List>
				{roomsData &&
					curRoom &&
					roomsData?.map((r) => (
						<React.Fragment key={r.rid}>
							<div>
								<Room
									svg={ArrowRightSVG}
									isFocused={r.rid === curRoom.rid}
									onClick={() => joinPrevRoom(r)}
								>
									<Data>
										<span>{r.rname}</span>
										<Lessen>RID#{r.rid}</Lessen>
									</Data>
								</Room>
								<Close svg={CloseSVG} color="red" onClick={() => leaveRoom(r.rid)} />
							</div>
							{r.rid === curRoom.rid &&
								curRoom?.activeUsers?.map((u) => (
									<div key={u.uid}>
										<User svg={UserSVG} isFocused={u.uid === user.uid}>
											{u.uname}
										</User>
									</div>
								))}
						</React.Fragment>
					))}
			</List>
			<Footer>
				<Button variant="fancy" onClick={togCreateRoomModal}>
					Create Room
				</Button>
				<Button variant="fancy" onClick={togJoinRoomModal}>
					Join Room
				</Button>
			</Footer>
		</DrawerRoot>
	)
	React.useEffect(() => setDrawerContent(drawerContent))

	return (
		<>
			<Modal isShown={modalShown} onClose={() => setModalShown(false)}>
				{createConfig ? createRoomModal : joinRoomModal}
			</Modal>
			{!isMobileWindow && drawerContent}
		</>
	)
}

export default ChatNav
