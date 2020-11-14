import { Component, createRef } from "react"
import styled from "styled-components/macro"
import socketIOClient from "socket.io-client"
import mergeWith from "lodash/mergeWith"

import { setupAppSharedOptions, Themes, Contexts, ls } from "../../shared/shared"
import { ReactComponent as ChatSVG } from "../../shared/assets/icons/chat.svg"
import ChatNav from "./ChatNav"
import Logs from "./Logs"
import ChatInput from "./ChatInput"
import { Input } from "../ui/IO"
import Button from "../ui/Button"
import { DateTime } from "luxon"

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div`
	display: flex;
`

const Main = styled.div`
	flex: 1 1;
	display: flex;
	flex-direction: column;
`

/* -------------------------------- COMPONENT ------------------------------- */

class Chat extends Component {
	constructor(props) {
		super(props)
		const prevData = this.getUserData()
		this.state = {
			curRoomRID: 1,
			curDMUID: null,
			myRooms: null,
			myDMS: null,
			user: null,
			initUsername: "",
			roomsShown: true,
			...prevData,
			socket: socketIOClient(process.env.REACT_APP_SERVER_URL),
		}
		this.tsChatOpened = DateTime.local()
		this.initUsernameRef = createRef()
		this.intervalHandleUnread = null
	}

	componentDidMount() {
		const { socket, user } = this.state

		// Setup socket event listeners.
		socket.on("updateRoom", this.updateRoom)
		socket.on("receiveData", this.receiveData)
		socket.on("reconnect", () => {
			console.log("socket reconnect event - loadUser() called")
			this.loadUser()
		})
		socket.on("disconnect", (reason) => console.log("socket disconnect event - reason: ", reason))
		// Setup data save on exit.
		window.addEventListener("beforeunload", this.saveUserData)
		// Attempt to load prev. save data if any.
		this.loadUser()
		// Auto focus username input field if available.
		if (!user && this.initUsernameRef.current) this.initUsernameRef.current.focus({ preventScroll: true })
		// Setup interval to mark messages as read for current room/DM.
		this.unreadIntervalTimeMS = 1000 * 30
		this.intervalHandleUnread = setInterval(this.unreadHandler, this.unreadIntervalTimeMS)
	}

	componentDidUpdate(prevProps, prevState) {
		const activityChange = prevProps.appActive !== this.props.appActive
		const viewChange = prevState.roomsShown !== this.state.roomsShown
		const roomChange = prevState.curRoomRID != this.state.curRoomRID
		const convoChange = prevState.curDMUID != this.state.curDMUID

		if (activityChange || viewChange || roomChange || convoChange) {
			// Reset unread handler interval when certain things occur.
			clearInterval(this.intervalHandleUnread)
			this.intervalHandleUnread = setInterval(this.unreadHandler, this.unreadIntervalTimeMS)
			// Prune temp DM convo rooms where no DMS were exchanged.
			this.pruneTempDMS()
		}
	}

	componentWillUnmount() {
		const { socket } = this.state
		// All of these are precautions if they fail to occur in other places.
		if (socket) console.log("cWU() socket.disconnect(): ", socket.disconnect())
		this.saveUserData()
		// Remove events & unread handler interval.
		window.removeEventListener("beforeunload", this.saveUserData)
		clearInterval(this.intervalHandleUnread)
	}

	getUserData = (passedUser) => {
		let prevData = sessionStorage.getItem("Chat")
		if (!prevData) return {}
		let { user, ...others } = JSON.parse(prevData)
		if (passedUser) user = passedUser
		const output = {
			user,
			...others,
		}
		return output
	}

	loadUser = async (passedUser) => {
		const { user: prevUser } = this.state
		if (!passedUser && !prevUser) return

		this.context.setAppLoading(true)
		let setupRes = null
		try {
			setupRes = await this.socketSetupUser(passedUser ?? prevUser)
		} catch (error) {
			console.error("<Chat /> loadUser() socketSetupUser() error: ", error)
			return this.context.setAppLoading(false)
		}
		let {
			data: { user, myRooms, curRoomRID, roomsShown },
		} = setupRes
		this.setState(setupRes.data, async () => {
			// Fast load initial room or DM (based on roomsShown).
			try {
				if (roomsShown) {
					await this.joinRoom({
						room: myRooms[curRoomRID],
						user,
					})
				} else {
					// await this.openDM(curDMUID)
				}
			} catch (error) {
				console.error("<Chat /> loadUser() joinRoom() error: ", error)
			}
			this.context.setAppLoading(false)
			// Then load all other rooms/DMS for notifications/etc.
			this.bgSetup()
		})
	}

	bgSetup = async () => {
		let nextState = { ...this.state }
		try {
			console.log("bgSetup()")
			const roomsProm = Object.keys(nextState.myRooms).map((rid) =>
				this.socketJoinRoom({ room: nextState.myRooms[rid], user: nextState.user })
			)
			const dmsProm = Object.keys(nextState.myDMS).map((recip_id) =>
				this.socketGetLogsDMS({ recip_id, user: nextState.user })
			)
			const roomsRes = await Promise.all(roomsProm)
			const dmsRes = await Promise.all(dmsProm)
			console.log("roomsRes: ", roomsRes)
			console.log("dmsRes: ", dmsRes)
			roomsRes.forEach(({ room }) => {
				if (room) {
					const { rid, msgs } = room
					const eleRoom = nextState.myRooms[rid]
					nextState.myRooms[rid] = {
						...(eleRoom ?? {}),
						...room,
						msgs: {
							...(eleRoom?.msgs ?? {}),
							...(msgs ?? {}),
						},
					}
				}
			})
			// dmsRes.forEach(({ data: convo }) => {
			// 	if (convo) {
			// 		const { recip_id, dms } = convo
			// 		const eleDM = data.myDMS[recip_id]
			// 		data.myDMS[recip_id] = {
			// 			...(eleDM ?? {}),
			// 			...convo,
			// 			dms: {
			// 				...(eleDM?.dms ?? {}),
			// 				...(dms ?? {}),
			// 			},
			// 		}
			// 	}
			// })
			this.setState(nextState)
		} catch (error) {
			console.error(error)
		}
	}

	// CHECKUP Recheck/redo after Chat app is finished.
	saveUserData = () => {
		if (!this.state.user || !this.state.myRooms) return
		// let prevData = sessionStorage.getItem("Chat")
		// prevData = prevData ? JSON.parse(prevData) : {}
		// sessionStorage.setItem(
		// 	"Chat",
		// 	JSON.stringify({
		// 		...prevData,
		// 		...this.state,
		// 	})
		// )
	}

	socketSetupUser = (nextUser) => {
		let { socket, user, myDMS, myRooms, curRoomRID, curDMUID, roomsShown } = this.state
		if (nextUser) user = nextUser

		return new Promise((resolve, reject) => {
			if (!socket || !user) {
				reject({ error: "client error - socketSetupUser() - bad vars" })
				return
			}
			socket.emit("setupUser", { uname: user.uname }, ({ success, error, data }) => {
				console.log(success ?? error, data)
				if (error) reject(error)
				else if (success) {
					const unreadCustomizer = (objVal, srcVal, key) => {
						if (key == "unread" && !isNaN(objVal)) return objVal + srcVal
					}
					data.myRooms = mergeWith(data.myRooms, myRooms ?? {}, unreadCustomizer)
					data.myDMS = mergeWith(data.myDMS, myDMS ?? {}, unreadCustomizer)
					data.roomsShown = roomsShown
					data.curRoomRID = curRoomRID ?? 1
					data.curDMUID = curDMUID ?? Object.keys(data.myDMS)?.[0]
					resolve({ success, data })
				}
			})
		})
	}

	unreadHandler = (passedData) => {
		const { curRoomRID, myRooms, myDMS, curDMUID, roomsShown } = this.state
		if (!this.props.appActive) return

		function makeUnread(data) {
			if (!data) return
			try {
				Object.keys(data).forEach((key) => {
					const obj = data[key]
					if (obj?.unread) obj.unread = false
				})
				if (data?.unread) data.unread = 0
			} catch (error) {
				console.error("<Chat /> unreadHandler() error: ", error)
			}
		}
		if (passedData) return makeUnread(passedData)

		let nextState = {}
		if (roomsShown && myRooms && curRoomRID) {
			nextState.myRooms = { ...myRooms }
			const curRoom = nextState.myRooms[curRoomRID]
			makeUnread(curRoom.msgs)
		} else if (!roomsShown && myDMS && curDMUID) {
			nextState.myDMS = { ...myDMS }
			const curConvo = nextState.myDMS[curDMUID]
			makeUnread(curConvo.dms)
		}
		if (Object.keys(nextState).length > 0) this.setState(nextState)
	}

	getLastTimestamp = (obj) => {
		let lastTS = null
		Object.keys(obj).forEach((key) => {
			if (obj[key]?.created_at) {
				const time = DateTime.fromISO(obj[key].created_at).toLocal()
				if (!lastTS || time > lastTS) lastTS = time
			}
		})
		return lastTS?.toISO()
	}

	updateRoom = (room, makeCur = false) => {
		let myRooms = { ...this.state.myRooms }
		const { rid, msgs } = room
		if (!rid) return console.error("updateRoom() error: no rid#, printing room param", room)

		myRooms[rid] = {
			...(myRooms[rid] ?? {}),
			...room,
			msgs: {
				...(myRooms[rid]?.msgs ?? {}),
				...(msgs ?? {}),
			},
		}

		this.setState({
			myRooms,
			...(makeCur && { curRoomRID: rid }),
		})
	}

	socketJoinRoom = ({ room, user, makeCur }) => {
		user = user ?? this.state.user
		room = this.state.myRooms?.[room?.rid] ?? room
		let { rid, password, msgs } = room

		if (!this.state.socket || !user || !rid) {
			console.log("client error - socketJoinRoom() - bad params", { user, rid })
			return Promise.reject({ error: "client error - socketJoinRoom() - bad params" })
		}

		return new Promise((resolve, reject) => {
			const ioVars = {
				uid: user.uid,
				rid,
				password,
				makeCur: makeCur ?? this.state.curRoomRID == room.rid,
			}
			if (msgs) ioVars.lastMsgTS = this.getLastTimestamp(msgs)
			this.state.socket.emit("joinRoom", ioVars, ({ success, error, room: roomRes }) => {
				console.log(success ?? error, roomRes)
				if (error) reject({ error })
				else if (success) {
					if (roomRes) roomRes.msgs = { ...(msgs ?? {}), ...roomRes.msgs }
					resolve({ success, room: roomRes })
				}
			})
		})
	}

	joinRoom = ({ room, user }) => {
		if (!room?.rid) return Promise.reject({ error: "client error - joinRoom() - no rid# provided" })

		this.setState({ roomsShown: true })
		return this.socketJoinRoom({ room, user, makeCur: true }).then((res) => {
			if (res?.room) this.updateRoom(res.room, true)
			return res
		})
	}

	deleteRoom = (selectedRID) => {
		const { curRoomRID, socket, user, myRooms } = this.state
		if (selectedRID === 1) return console.log("deleteRoom() - can't delete 'General'")

		new Promise((resolve, reject) => {
			socket.emit("deleteRoom", { uid: user.uid, rid: selectedRID }, ({ success, error }) => {
				console.log(success ?? error)
				if (error) reject({ error })
				else if (success) resolve({ success })
			})
		})
			.then(async () => {
				if (curRoomRID == selectedRID) {
					try {
						await this.joinRoom({ room: myRooms[1], user })
					} catch (error) {
						throw Error(error)
					}
				}
				let nextRooms = { ...myRooms }
				delete nextRooms[selectedRID]
				this.setState({ myRooms: nextRooms })
			})
			.catch((error) => console.error("<Chat /> deleteRoom() error: ", error))
	}

	socketCreateRoom = (room) => {
		const { socket, user } = this.state
		const { rname, password } = room
		const ioVars = {
			uid: user.uid,
			rname,
			password,
		}
		return new Promise((resolve, reject) => {
			socket.emit("createRoom", ioVars, ({ error, success, room: roomRes }) => {
				console.log(error ?? success, roomRes)
				if (error) return reject({ error })
				return resolve({ success, room: roomRes })
			})
		})
	}

	createRoom = (room) => {
		return this.socketCreateRoom(room).then(({ room: roomRes }) => {
			this.updateRoom(roomRes, true)
			return roomRes
		})
	}

	socketSendRoomMsg = (msg) => {
		const { socket, curRoomRID, user } = this.state
		return new Promise((resolve, reject) => {
			socket.emit("sendRoomMsg", { msg, rid: curRoomRID, uid: user.uid }, ({ error, success, msgs }) => {
				console.log(success ?? error, msgs)
				if (success && msgs) {
					const users_last_msg_ts = Object.values(msgs).pop()?.created_at
					this.updateRoom({ rid: curRoomRID, msgs, users_last_msg_ts })
					resolve({ success, msgs })
				} else reject({ error })
			})
		})
	}

	openDM = async (passedUser) => {
		const { user, myDMS } = this.state
		const { uid: recip_id, uname: recip_uname } = passedUser
		if (!recip_id) return console.log("openDM() skipped, no recip_id!")
		else if (recip_id == user?.uid) return console.log("openDM() skipped, can't send DM to yourself!")

		let nextState = {
			roomsShown: false,
			curDMUID: recip_id,
			myDMS: {
				...(myDMS ?? {}),
			},
		}

		if (myDMS[recip_id]) {
			try {
				const data = await this.socketGetLogsDMS({ recip_id, user })
				this.updateDM(data)
			} catch (error) {}
		} else {
			nextState.myDMS[recip_id] = {
				temp: true,
				recip_uname,
				dms: {},
			}
		}
		console.log("openDM() setState -> ", nextState)
		this.setState(nextState)
	}

	socketGetLogsDMS = ({ recip_id, user: passedUser }) => {
		let { socket, myDMS, user } = this.state
		if (passedUser) user = passedUser
		if (!recip_id && !user?.uid) return Promise.reject("socketGetLogsDMS() bad params")

		const convo = myDMS?.[recip_id]
		// To prevent redundant calls to the DB. We could set this up for rooms as well, but
		// rooms are kept track of on the server actively. DMS are not, so there is no way to know on the
		// server if the user doesn't need logs or not.
		if (convo?.tsLogsFetched) {
			const dtFetched = DateTime.fromISO(convo.tsLogsFetched).toLocal()
			if (this.tsChatOpened < dtFetched)
				return Promise.reject("socketGetLogsDMS() no need to retrieve DMS again")
		}
		return new Promise((resolve, reject) => {
			let ioVars = {
				uid: user.uid,
				recip_id,
			}
			const dms = convo?.dms
			if (dms) ioVars.lastDMTS = this.getLastTimestamp(dms)
			socket.emit("getLogsDMS", ioVars, ({ success, error, data }) => {
				console.log(success ?? error, data)
				if (error) reject({ error })
				else if (success) {
					data.dms = { ...(dms ?? {}), ...(data?.dms ?? {}) }
					data.tsLogsFetched = DateTime.local().toISO()
					resolve({ success, data })
				}
			})
		})
	}

	socketSendDM = (text) => {
		const { socket, curDMUID, user } = this.state
		return new Promise((resolve, reject) => {
			if (!user?.uid || !curDMUID || !text)
				return reject({ error: "client - socketSendDM() - bad params" })
			const ioVars = { uid: user.uid, recip_id: curDMUID, msg: text }
			socket.emit("sendDM", ioVars, ({ success, error, data }) => {
				console.log(success ?? error, data)
				if (error) reject({ error })
				else if (success) {
					this.updateDM(data)
					resolve({ success, data })
				}
			})
		})
	}

	updateDM = (data) => {
		// data { recip_id, dms: { dmid#: { ...dmData } } }
		if (!data) return
		console.log("receiveDM() data: ", data)
		const { recip_id, dms } = data
		if (!dms) return

		const { myDMS } = this.state
		let nextMyDMS = { ...myDMS }
		let convo = nextMyDMS[recip_id]
		convo = {
			...(convo ?? {}),
			dms: {
				...(convo?.dms ?? {}),
				...(dms ?? {}),
			},
		}
		if (convo?.temp) convo.temp = false
		this.setState({ myDMS: nextMyDMS })
	}

	pruneTempDMS = () => {
		const { curDMUID, myDMS, roomsShown } = this.state
		if (!curDMUID || !myDMS) return

		let nextMyDMS = { ...myDMS }
		const toDelete = Object.keys(nextMyDMS).filter((recip_id) => {
			const skip = recip_id == curDMUID && !roomsShown
			return !skip && nextMyDMS[recip_id]?.temp
		})
		if (toDelete.length > 0) {
			toDelete.forEach((recip_id) => delete nextMyDMS[recip_id])
			const replacementDMUID = Object.keys(nextMyDMS)?.[0]
			this.setState({ myDMS: nextMyDMS, curDMUID: replacementDMUID })
		}
	}

	receiveData = ({ data }) => {
		// Incoming data will automatically be flagged unread from server. So if the user is active we
		// need to change the data before merging it into our state.
		if (data.msgs) {
			if (this.props.appActive) this.unreadHandler(data.msgs)
			this.updateRoom(data)
		} else if (data.dms) {
			if (this.props.appActive) this.unreadHandler(data.dms)
			this.updateDM(data)
		}
	}

	submitName = (e) => {
		e.preventDefault()
		const { initUsername } = this.state
		this.loadUser({ uname: initUsername })
	}

	changeName = (e) => {
		this.setState({ initUsername: e.target.value })
	}

	// TODO Remove after Chat is finished.
	log = () => {
		const { socket } = this.state
		if (socket) socket.emit("log")
	}

	render() {
		const { user, initUsername, curRoomRID, curDMUID, myRooms, myDMS, roomsShown } = this.state
		let data = null
		if (!roomsShown && curDMUID) data = myDMS[curDMUID]
		else if (roomsShown && myRooms) data = myRooms[curRoomRID]
		return (
			<Root>
				{user?.uname ? (
					<>
						<ChatNav
							myDMS={myDMS}
							myRooms={myRooms}
							curDMUID={curDMUID}
							curRoomRID={curRoomRID}
							createRoom={this.createRoom}
							joinRoom={this.joinRoom}
							deleteRoom={this.deleteRoom}
							openDM={this.openDM}
							user={user}
						/>
						<Main>
							<Logs data={data} user={user} openDM={this.openDM} roomsShown={roomsShown} />
							<ChatInput
								socketSendRoomMsg={this.socketSendRoomMsg}
								roomsShown={roomsShown}
								socketSendDM={this.socketSendDM}
							/>
						</Main>
					</>
				) : (
					<form onSubmit={this.submitName}>
						<label>
							Enter name:{" "}
							<Input
								type="text"
								value={initUsername}
								onChange={this.changeName}
								minLength="1"
								required
								ref={this.initUsernameRef}
							/>
						</label>
						<Button type="submit" variant="fancy">
							Submit
						</Button>
					</form>
				)}
				{/* TODO Remove after Chat is finished. */}
				<div style={{ position: "absolute", left: "50%", top: "8px" }}>
					<Button variant="outline" onClick={this.log}>
						log
					</Button>
				</div>
			</Root>
		)
	}
}

Chat.contextType = Contexts.Window
Chat.shared = setupAppSharedOptions({
	title: "Chat",
	logo: ChatSVG,
	theme: Themes.red,
	authRequired: false,
})

export default Chat
