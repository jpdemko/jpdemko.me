/* eslint-disable jsx-a11y/label-has-associated-control */

import * as React from "react"
import styled, { css } from "styled-components/macro"

import { ReactComponent as CloseSVG } from "../../shared/assets/icons/close.svg"
import { ReactComponent as ArrowRightSVG } from "../../shared/assets/icons/arrow-right.svg"
import { ReactComponent as UserSVG } from "../../shared/assets/icons/user.svg"
import { ReactComponent as GroupAddSVG } from "../../shared/assets/icons/group-add.svg"
import { ReactComponent as AddSVG } from "../../shared/assets/icons/add.svg"
import { ReactComponent as ChatSVG } from "../../shared/assets/icons/chat.svg"
import { Contexts } from "../../shared/shared"
import Button from "../ui/Button"
import Modal from "../ui/Modal"
import { Input } from "../ui/IO"
import Accordion from "../ui/Accordion"

/* --------------------------------- STYLES --------------------------------- */

const DrawerRoot = styled.div`
	--chatnav-padding: 0.25em;
	flex: 0 0 auto;
	display: flex;
	flex-direction: column;
	${({ theme, isMobileWindow }) => css`
		border-right: ${isMobileWindow ? "none" : `1px solid ${theme.accent}`};
	`}
`

const Header = styled.div`
	flex: 0 0 auto;
	padding: var(--chatnav-padding) calc(var(--chatnav-padding) * 2);
	display: flex;
	align-items: center;
`

const Title = styled.span`
	font-weight: 500;
	font-style: italic;
	text-transform: uppercase;
`

const HeaderBtn = styled(Button)`
	height: 1.5em;
	margin-left: calc(var(--chatnav-padding) * 2);
`

const Rooms = styled.div`
	padding: var(--chatnav-padding);
	> div {
		padding-top: calc(var(--chatnav-padding) - 0.2em);
	}
	> div:first-child {
		padding: 0;
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
	margin-left: calc(var(--chatnav-padding) * 6);
`

const Close = styled(Button)`
	margin-left: var(--chatnav-padding);
`

const DMs = styled.div`
	display: flex;
	flex-direction: column;
	padding: var(--chatnav-padding);
`

const LastDM = styled(Button)`
	padding: var(--chatnav-padding);
	text-align: left;
	margin-bottom: var(--chatnav-padding);
	&:last-child {
		margin-bottom: 0;
	}
	${({ theme }) => css`
		background: ${theme.altBackground};
		border: 1px solid ${theme.accent};
		.last-dm-row {
			padding: var(--chatnav-padding);
			svg {
				margin-right: var(--chatnav-padding);
			}
		}
		.last-dm-row:first-child {
			display: inline-block;
			border-bottom: 1px solid ${theme.accent};
		}
	`}
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

const DmTextSum = styled.span`
	font-size: 0.8em;
	font-weight: 400;
`

/* -------------------------------- COMPONENT ------------------------------- */

function ChatNav({ joinedRooms, ongoingDMs, curRoom, createRoom, joinRoom, deleteRoom, user }) {
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
		const fixRID = Object.prototype.toString.call(rid) === "[object String]" ? Number.parseInt(rid) : rid
		let vars = { rid: fixRID, password: password?.length < 6 ? null : password }
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

	const accordionData = [
		{
			id: 1,
			title: (
				<Header>
					<Title>Rooms</Title>
					<div style={{ marginLeft: "auto" }}>
						<HeaderBtn svg={AddSVG} variant="outline" onClick={togCreateRoomModal}>
							Create
						</HeaderBtn>
						<HeaderBtn svg={GroupAddSVG} variant="outline" onClick={togJoinRoomModal}>
							Join
						</HeaderBtn>
					</div>
				</Header>
			),
			content:
				joinedRooms &&
				curRoom &&
				joinedRooms?.map((r) => (
					<Rooms key={r.rid}>
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
							<Close svg={CloseSVG} color="red" onClick={() => deleteRoom(r.rid)} />
						</div>
						{r.rid === curRoom.rid &&
							curRoom?.activeUsers?.map((u) => (
								<div key={u.uid}>
									<User svg={UserSVG} isFocused={u.uid === user.uid}>
										{u.uname}
									</User>
								</div>
							))}
					</Rooms>
				)),
		},
		{
			id: 2,
			title: (
				<Header>
					<Title>DMs</Title>
				</Header>
			),
			content: (
				<DMs>
					{ongoingDMs &&
						ongoingDMs?.map((dmSum) => (
							<LastDM key={dmSum.recip_id} column>
								<div className="last-dm-row">
									<UserSVG />
									<span style={{ fontStyle: "italic" }}>{dmSum.recip_uname}</span>
								</div>
								<div className="last-dm-row">
									<ChatSVG />
									<DmTextSum>{dmSum.msg}</DmTextSum>
								</div>
							</LastDM>
						))}
				</DMs>
			),
		},
	]

	const drawerContent = (
		<DrawerRoot>
			<Accordion data={accordionData} />
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
