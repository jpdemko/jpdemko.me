/* eslint-disable jsx-a11y/label-has-associated-control */

import { useState, useRef, useContext, useEffect, useMemo } from "react"
import styled, { css } from "styled-components/macro"

import { ReactComponent as SvgClose } from "../../shared/assets/material-icons/close.svg"
import { ReactComponent as SvgArrowRight } from "../../shared/assets/material-icons/arrow-right.svg"
import { ReactComponent as SvgUser } from "../../shared/assets/material-icons/user.svg"
import { ReactComponent as SvgGroupAdd } from "../../shared/assets/material-icons/group-add.svg"
import { ReactComponent as SvgAdd } from "../../shared/assets/material-icons/add.svg"
import { ReactComponent as SvgChat } from "../../shared/assets/material-icons/chat.svg"
import { Contexts } from "../../shared/shared"
import Button from "../ui/Button"
import Modal from "../ui/Modal"
import { Input } from "../ui/IO"
import Accordion from "../ui/Accordion"

/* --------------------------------- STYLES --------------------------------- */

const DrawerRoot = styled.div`
	--chatnav-padding: 0.5rem;
	flex: 0 0 auto;
	display: flex;
	flex-direction: column;
	font-size: 0.9em;

	${({ theme, isMobileWindow }) => css`
		border-right: ${isMobileWindow ? "none" : `1px solid ${theme.accent}`};
	`}
`

const Header = styled.div`
	flex: 0 0 auto;
	display: flex;
	align-items: center;
`

const RoomsSubHeader = styled.div`
	height: 1.5em;
	margin-left: var(--chatnav-padding);
	display: flex;
`

const Title = styled.span`
	font-weight: bold;
	font-style: italic;
	text-transform: uppercase;
`

const HeaderBtn = styled(Button)`
	margin-left: var(--chatnav-padding);
`

const Rooms = styled.div`
	padding: var(--chatnav-padding);
	> * {
		margin-bottom: var(--chatnav-padding);
	}
	> *:last-child {
		margin-bottom: 0;
	}
`

const Room = styled.div`
	padding: var(--chatnav-padding);
	> div {
		padding-top: var(--chatnav-padding);
		display: flex;
		align-items: center;
	}
	> div:first-child {
		padding-top: 0;
	}
	${({ theme }) => css`
		background: ${theme.altBackground};
	`}
`

const RoomData = styled.div``

const RoomDataBtn = styled(Button)`
	button {
		height: 100%;
	}
	${({ isFocused }) => css`
		svg {
			transition: 0.2s transform;
			transform: rotate(${isFocused ? "90deg" : "0"});
		}
	`}
`

const User = styled(Button)`
	margin-left: calc(var(--chatnav-padding) * 6);
`

const RoomCloseBtn = styled(Button)`
	margin-left: var(--chatnav-padding);
`

const DMs = styled.div`
	display: flex;
	flex-direction: column;
	padding: var(--chatnav-padding);
`

const LatestDM = styled(Button)`
	padding: 0;
	text-align: left;
	margin-bottom: var(--chatnav-padding);
	&:last-child {
		margin-bottom: 0;
	}
	${({ theme, isFocused }) => css`
		color: ${theme.bgContrast};
		border: ${isFocused ? 1 : 0}px solid ${theme.accent};
		> div {
			margin: 0 !important;
		}
		.latest-dm-row {
			padding: calc(var(--chatnav-padding) * 0.75);
			svg {
				margin-right: var(--chatnav-padding);
			}
		}
		.latest-dm-row:first-child {
			background: ${theme.altBackground};
		}
	`}
`

const ModalRoot = styled.div`
	--modal-padding: 0.5em;
	min-width: max-content;
	padding: var(--modal-padding);
	form {
		background: inherit;
		display: flex;
		flex-direction: column;
		> * {
			margin: var(--modal-padding);
		}
	}
	${({ theme }) => css`
		background: ${theme.altBackground};
		border: 1px solid ${theme.accent};
		color: ${theme.bgContrast};
	`}
`

const Data = styled.div`
	display: inline-flex;
	align-items: center;
`

const Empha = styled.span`
	font-weight: bold;
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

function ChatNav({
	myRooms,
	myDMS,
	curDMUID,
	curRoomRID,
	createRoom,
	joinRoom,
	deleteRoom,
	openDM,
	user,
	...props
}) {
	const { setAppDrawerContent, isMobileWindow } = useContext(Contexts.Window)

	const [rname, setRName] = useState("")
	const [password, setPassword] = useState("")
	const [rid, setRID] = useState("")

	const [modalShown, setModalShown] = useState(false)
	const [createConfig, setCreateConfig] = useState(true)

	const createRoomModalRef = useRef()
	function togCreateRoomModal(e) {
		e.stopPropagation() // Click event fired for accordion tab buttons otherwise.
		setCreateConfig(true)
		setModalShown(true)
	}

	const joinRoomModalRef = useRef()
	function togJoinRoomModal(e) {
		e.stopPropagation() // Click event fired for accordion tab buttons otherwise.
		setCreateConfig(false)
		setModalShown(true)
	}

	useEffect(() => {
		if (modalShown) {
			const ref = createConfig ? createRoomModalRef : joinRoomModalRef
			if (ref.current) ref.current.focus()
		}
	}, [createConfig, modalShown])

	function submitJoinRoom(e) {
		e.preventDefault()
		const fixRID = Object.prototype.toString.call(rid) === "[object String]" ? Number.parseInt(rid) : rid
		let roomVars = { rid: fixRID, password: password?.length < 6 ? null : password }
		joinRoom({ room: roomVars })
			.then(() => setModalShown(false))
			.catch((error) => console.error("<ChatNav /> submitJoinRoom() error: ", error))
			.finally(() => {
				setRID("")
				setPassword("")
			})
	}

	function submitCreateRoom(e) {
		e.preventDefault()
		createRoom({ rname, password: password?.length < 6 ? null : password })
			.then(() => setModalShown(false))
			.catch((error) => console.error("<ChatNav /> submitCreateRoom() error: ", error))
			.finally(() => {
				setRName("")
				setPassword("")
			})
	}

	function joinPrevRoom(room) {
		joinRoom({ room }).catch((error) => console.error("<ChatNav /> joinPrevRoom() error: ", error))
	}

	const sortedRIDS = useMemo(() => {
		return myRooms
			? Object.keys(myRooms).sort((rid1, rid2) => {
					const ts1 = myRooms?.[rid1]?.users_last_msg_ts
					const ts2 = myRooms?.[rid2]?.users_last_msg_ts
					return ts1 < ts2 ? 1 : ts1 > ts2 ? -1 : 0
			  })
			: []
	}, [myRooms])

	const sortedDMUIDS = useMemo(() => {
		return myDMS
			? Object.keys(myDMS).sort((uid1, uid2) => {
					const t1 = Object.values(myDMS[uid1]?.dms).filter(isNaN).pop()?.created_at
					const t2 = Object.values(myDMS[uid2]?.dms).filter(isNaN).pop()?.created_at
					return t1 < t2 ? 1 : t1 > t2 ? -1 : 0
			  })
			: []
	}, [myDMS])

	const accordionData = [
		{
			id: 1,
			title: (
				<Header>
					<Title>Rooms</Title>
					<RoomsSubHeader>
						<HeaderBtn
							svg={SvgAdd}
							variant="outline"
							onClick={togCreateRoomModal}
							setColor="primaryContrast"
						>
							Create
						</HeaderBtn>
						<HeaderBtn
							svg={SvgGroupAdd}
							variant="outline"
							onClick={togJoinRoomModal}
							setColor="primaryContrast"
						>
							Join
						</HeaderBtn>
					</RoomsSubHeader>
				</Header>
			),
			content: (
				<Rooms>
					{myDMS &&
						curRoomRID &&
						sortedRIDS.map((rid) => (
							<Room key={rid}>
								<RoomData>
									<RoomDataBtn
										svg={SvgArrowRight}
										isFocused={rid == curRoomRID}
										onClick={() => joinPrevRoom(myRooms?.[rid])}
										badge={myRooms?.[rid]?.msgs?.unread > 0 ? "!" : null}
									>
										<Data className="chLimit">
											<span>{myRooms?.[rid]?.rname}</span>
											<Lessen>RID#{rid}</Lessen>
										</Data>
									</RoomDataBtn>
									<RoomCloseBtn
										svg={SvgClose}
										setTheme="red"
										setColor="primary"
										onClick={() => deleteRoom(rid)}
									/>
								</RoomData>
								{rid == curRoomRID &&
									myRooms?.[curRoomRID]?.activeUsers &&
									Object.keys(myRooms[curRoomRID]?.activeUsers)?.map((uid) => {
										const actUser = myRooms[curRoomRID].activeUsers[uid]
										return (
											<div key={uid}>
												<User
													svg={SvgUser}
													isFocused={actUser.uid == user.uid}
													onClick={() => openDM(actUser)}
													className="chLimit"
												>
													{actUser.uname}
												</User>
											</div>
										)
									})}
							</Room>
						))}
				</Rooms>
			),
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
					{myDMS &&
						sortedDMUIDS.map((recip_id) => {
							const recipUser = { uid: recip_id, uname: myDMS[recip_id]?.recip_uname }
							const lastDMID = Object.keys(myDMS[recip_id]?.dms)
								.filter((dmid) => !isNaN(dmid))
								.pop()
							const lastDM = myDMS[recip_id]?.dms?.[lastDMID]?.msg
							return (
								<LatestDM
									key={recip_id}
									isFocused={recip_id == curDMUID}
									onClick={() => openDM(recipUser)}
									badge={myDMS[recip_id]?.dms?.unread > 0 ? "!" : null}
									column
								>
									<div className="latest-dm-row chLimit">
										<SvgUser />
										<span style={{ fontStyle: "italic" }}>{recipUser.uname}</span>
									</div>
									<div className="latest-dm-row chLimit">
										<SvgChat />
										<DmTextSum>{lastDM}</DmTextSum>
									</div>
								</LatestDM>
							)
						})}
				</DMs>
			),
		},
	]

	const drawerContent = (
		<DrawerRoot>
			<Accordion data={accordionData} />
		</DrawerRoot>
	)
	// Can't update during an existing state transition. So defer it.
	useEffect(() => setAppDrawerContent(drawerContent))

	const createRoomModal = (
		<ModalRoot>
			<form onSubmit={submitCreateRoom}>
				<div>
					<Empha>Create room config!</Empha>
				</div>
				<Input
					type="text"
					label="Room name"
					placeholder="Room name required"
					value={rname}
					onChange={(e) => setRName(e.target.value)}
					minLength="1"
					required
					ref={createRoomModalRef}
				/>
				<Input
					type="password"
					label="Password"
					placeholder="Optional password (min. 6ch)"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					minLength="6"
				/>
				<div>
					<Button type="submit" variant="fancy">
						Submit
					</Button>
				</div>
			</form>
		</ModalRoot>
	)
	const joinRoomModal = (
		<ModalRoot>
			<form onSubmit={submitJoinRoom}>
				<div>
					<Empha>Join room config!</Empha>
				</div>
				<Input
					type="text"
					label="Room ID#"
					placeholder="Room ID# required"
					value={rid}
					onChange={(e) => setRID(e.target.value)}
					minLength="1"
					required
					ref={joinRoomModalRef}
				/>
				<Input
					type="password"
					label="Password"
					placeholder="Optional password (min. 6ch)"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					minLength="6"
				/>
				<div>
					<Button type="submit" variant="fancy">
						Submit
					</Button>
				</div>
			</form>
		</ModalRoot>
	)

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
