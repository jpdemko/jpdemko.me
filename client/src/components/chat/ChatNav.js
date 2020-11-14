/* eslint-disable jsx-a11y/label-has-associated-control */

import { useState, useRef, useContext, useEffect, useMemo } from "react"
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
import { DateTime } from "luxon"

/* --------------------------------- STYLES --------------------------------- */

const DrawerRoot = styled.div`
	--chatnav-padding: 0.4em;
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

const RoomsSubHeader = styled.div`
	height: 1.5em;
	margin-left: var(--chatnav-padding);
	display: flex;
`

const Title = styled.span`
	font-weight: 500;
	font-style: italic;
	text-transform: uppercase;
`

const HeaderBtn = styled(Button)`
	margin-left: calc(var(--chatnav-padding) * 2);
`

const Rooms = styled.div`
	padding: var(--chatnav-padding);
`

const Room = styled.div`
	padding: calc(var(--chatnav-padding) / 2);
	> div {
		padding-top: calc(var(--chatnav-padding) / 2);
	}
	${({ isFocused, theme }) => css`
		background: ${isFocused ? theme.altBackground : "none"};
	`}
`

const RoomData = styled.div``

const RoomDataBtn = styled(Button)`
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
	${({ theme }) => css`
		border: 1px solid ${theme.accent};
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
	padding: var(--modal-padding) calc(var(--modal-padding) * 2);
	form > div {
		padding: var(--modal-padding);
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

function ChatNav({ myRooms, myDMS, curDMUID, curRoomRID, createRoom, joinRoom, deleteRoom, openDM, user }) {
	const { setAppDrawerContent, isMobileWindow } = useContext(Contexts.Window)

	const [rname, setRName] = useState("")
	const [password, setPassword] = useState("")
	const [rid, setRID] = useState("")

	const [modalShown, setModalShown] = useState(false)
	const [createConfig, setCreateConfig] = useState(true)

	const createRoomModalRef = useRef()
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

	const joinRoomModalRef = useRef()
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

	function togCreateRoomModal(e) {
		e.stopPropagation()
		setCreateConfig(true)
		setModalShown(true)
	}
	function togJoinRoomModal(e) {
		e.stopPropagation()
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
		joinRoom({ room })
			.then(console.log)
			.catch((error) => console.error("<ChatNav /> joinPrevRoom() error: ", error))
	}

	const sortedRIDS = useMemo(() => {
		return Object.keys(myRooms).sort((rid1, rid2) => {
			const ts1 = myRooms?.[rid1]?.users_last_msg_ts
			const ts2 = myRooms?.[rid2]?.users_last_msg_ts
			return ts1 < ts2 ? 1 : ts1 > ts2 ? -1 : 0
		})
	}, [myRooms])

	const sortedDMUIDS = useMemo(() => {
		return Object.keys(myDMS).sort((uid1, uid2) => {
			const t1 = Object.values(myDMS[uid1]?.dms).filter(isNaN).pop()?.created_at
			const t2 = Object.values(myDMS[uid2]?.dms).filter(isNaN).pop()?.created_at
			return t1 < t2 ? 1 : t1 > t2 ? -1 : 0
		})
	}, [myDMS])

	const accordionData = [
		{
			id: 1,
			title: (
				<Header>
					<Title>Rooms</Title>
					<RoomsSubHeader>
						<HeaderBtn
							svg={AddSVG}
							variant="outline"
							onClick={togCreateRoomModal}
							color="primaryContrast"
						>
							Create
						</HeaderBtn>
						<HeaderBtn
							svg={GroupAddSVG}
							variant="outline"
							onClick={togJoinRoomModal}
							color="primaryContrast"
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
							<Room key={rid} isFocused={rid == curRoomRID}>
								<RoomData>
									<RoomDataBtn
										svg={ArrowRightSVG}
										isFocused={rid == curRoomRID}
										onClick={() => joinPrevRoom(myRooms?.[rid])}
										badge={myRooms?.[rid]?.msgs?.unread > 0 ? "!" : null}
									>
										<Data>
											<span>{myRooms?.[rid]?.rname}</span>
											<Lessen>RID#{rid}</Lessen>
										</Data>
									</RoomDataBtn>
									<RoomCloseBtn
										svg={CloseSVG}
										setTheme="red"
										color="primary"
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
													svg={UserSVG}
													isFocused={actUser.uid == user.uid}
													onClick={() => openDM(actUser)}
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
									column
								>
									<div className="latest-dm-row">
										<UserSVG />
										<span style={{ fontStyle: "italic" }}>{recipUser.uname}</span>
									</div>
									<div className="latest-dm-row">
										<ChatSVG />
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
