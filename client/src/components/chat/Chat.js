import * as React from "react"
import styled from "styled-components/macro"
import socketIOClient from "socket.io-client"
import mergeWith from "lodash/mergeWith"

import { setupAppSharedOptions, themes, Contexts, ls } from "../../shared/shared"
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

class Chat extends React.Component {
	constructor(props) {
		super(props)
		const prevData = this.getUserData()
		this.state = {
			curRoomRID: 1,
			curDMid: null,
			myRooms: null,
			myDMs: null,
			user: null,
			initUsername: "",
			roomsShown: true,
			...prevData,
			socket: socketIOClient(process.env.REACT_APP_SERVER_URL),
		}
		this.initUsernameRef = React.createRef()
		this.intervalHandleUnreadMsgs = null
	}

	componentDidMount() {
		const { socket, user } = this.state

		// Setup socket event listeners.
		socket.on("updateRoom", this.updateRoom)
		socket.on("receiveMsg", this.receiveMsg)
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
		this.intervalHandleUnreadMsgs = setInterval(this.unreadMsgsHandler, 1000 * 60)
	}

	componentDidUpdate(prevProps, prevState) {
		// Reset unread msgs interval on room change.
		if (prevState.curRoomRID != this.state.curRoomRID || prevProps.appActive !== this.props.appActive) {
			clearInterval(this.intervalHandleUnreadMsgs)
			this.intervalHandleUnreadMsgs = setInterval(this.unreadMsgsHandler, 1000 * 60)
		}
	}

	componentWillUnmount() {
		const { socket } = this.state
		// All of these are precautions if they fail to occur in other places.
		if (socket) console.log("cWU() socket.disconnect(): ", socket.disconnect())
		this.saveUserData()
		// Remove events & unread msgs interval.
		window.removeEventListener("beforeunload", this.saveUserData)
		clearInterval(this.intervalHandleUnreadMsgs)
	}

	unreadMsgsHandler = () => {
		let { curRoomRID, myRooms } = this.state
		if (!myRooms || !curRoomRID || !this.props.appActive) return

		myRooms = { ...myRooms }
		Object.keys(myRooms[curRoomRID].msgs).forEach((mid) => {
			const val = myRooms[curRoomRID].msgs[mid]
			if (isNaN(val)) val.unread = false
		})
		myRooms[curRoomRID].msgs.unread = 0
		this.setState({ myRooms })
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

	updateRoom = (room, makeCur = false) => {
		const myRooms = { ...this.state.myRooms }
		const { rid } = room
		if (!rid) return console.error("updateRoom() error: no rid#, printing room param", room)
		console.log("updateRoom() called")

		myRooms[rid] = mergeWith(myRooms[rid] ?? {}, room, (objValue, srcValue, key) => {
			if (key == "unread" && !isNaN(objValue)) return objValue + srcValue
		})

		this.setState({
			myRooms,
			...(makeCur && { curRoomRID: rid }),
		})
	}

	loadUser = (passedData) => {
		let { user, curRoomRID, myRooms } = passedData ?? this.state
		if (!user) return

		this.context.setIsLoading(true)
		this.socketSetupUser(user)
			.then(async ({ data }) => {
				// { user, myRooms, myDMs } = data
				user = data.user
				myRooms = { ...data.myRooms, ...(myRooms && myRooms) }
				try {
					const joinRoomPromises = Object.keys(myRooms).map((rid) =>
						this.socketJoinRoom({ room: myRooms[rid], user, makeCur: rid == curRoomRID })
					)
					const roomsRes = await Promise.all(joinRoomPromises)
					let loadedRooms = roomsRes.reduce((acc, curRes) => {
						if (curRes) acc[curRes.room.rid] = curRes.room
						return acc
					}, {})
					this.setState({ myRooms: { ...myRooms, ...loadedRooms }, curRoomRID: curRoomRID ?? 1, user })
				} catch (error) {
					console.error(error)
					throw Error(error)
				}
			})
			.catch((err) => {
				console.error(err)
				this.setState({ user: null, curRoomRID: null, curDMid: null, myRooms: null, myDMs: null })
			})
			.finally(() => this.context.setIsLoading(false))
	}

	// CHECKUP Recheck/redo after shared.js ls object finishes.
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
		const { socket, user } = this.state
		if (!nextUser && user) nextUser = user
		return new Promise((resolve, reject) => {
			if (!socket || !nextUser) {
				reject({ error: "client error - socketSetupUser() - bad vars" })
				return
			}
			socket.emit("setupUser", { uname: nextUser.uname }, ({ success, error, data }) => {
				console.log(success ?? error, data)
				if (error) reject(error)
				else if (success) resolve({ success, data })
			})
		})
	}

	getLastTimestamp = (obj) => {
		let lastTS = null
		Object.keys(obj).forEach((key) => {
			if (obj[key]?.created_at) {
				const time = DateTime.fromISO(obj[key].created_at).toLocal()
				if (!lastTS || time > lastTS) lastTS = time
			}
		})
		return lastTS.toISO()
	}

	socketJoinRoom = ({ room, user, makeCur = false }) => {
		user = user ?? this.state.user
		room = this.state.myRooms?.[room?.rid] ?? room
		let { rid, password, msgs } = room

		if (!this.state.socket || !user || !rid) {
			console.error("client error - socketJoinRoom() - bad params", { user, rid })
			return Promise.reject({ error: "client error - socketJoinRoom() - bad params" })
		}

		return new Promise((resolve, reject) => {
			const ioVars = {
				uid: user.uid,
				rid,
				password,
				makeCur,
			}
			if (msgs) ioVars.lastMsgTS = this.getLastTimestamp(msgs)
			this.state.socket.emit("joinRoom", ioVars, ({ success, error, room: roomRes }) => {
				console.log(success ?? error, roomRes)
				if (error) reject({ error })
				else if (success && roomRes) {
					roomRes.msgs = { ...(msgs ?? {}), ...roomRes.msgs }
					resolve({ success, room: roomRes })
				}
			})
		})
	}

	joinRoom = ({ room, user }) => {
		if (!room?.rid) return Promise.reject({ error: "client error - joinRoom() - no rid# provided" })

		this.setState({ roomsShown: true })
		if (room.rid == this.state.curRoomRID) {
			return Promise.reject({ error: "client error - joinRoom() - already in that room" })
		} else {
			return this.socketJoinRoom({ room, user, makeCur: true }).then((res) => {
				let { room: roomRes } = res
				this.updateRoom(roomRes, true)
				return res
			})
		}
	}

	deleteRoom = (rid) => {
		const { curRoomRID, socket, user, myRooms } = this.state
		if (rid === 1) return console.log("deleteRoom() - can't delete 'General'")

		new Promise((resolve, reject) => {
			socket.emit("deleteRoom", { uid: user.uid, rid }, ({ success, error }) => {
				console.log(success ?? error)
				if (error) reject({ error })
				else resolve({ success })
			})
		})
			.then(async () => {
				if (curRoomRID == rid) {
					try {
						await this.joinRoom({ room: myRooms[1], makeCur: true })
					} catch (error) {
						throw Error(error)
					}
				}
				this.setState({ myRooms: myRooms.filter((r) => r.rid !== rid) })
			})
			.catch(console.error)
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
					this.updateRoom({ rid: curRoomRID, msgs })
					resolve({ success, msgs })
				} else reject({ error })
			})
		})
	}

	receiveMsg = (data) => {
		if (this.props.appActive && data.msgs) {
			Object.keys(data.msgs).forEach((mid) => {
				if (!isNaN(mid)) data.msgs[mid].unread = false
			})
			data.msgs.unread = 0
		}
		this.updateRoom(data)
	}

	submitName = (e) => {
		e.preventDefault()
		const { initUsername } = this.state
		this.loadUser({ user: { uname: initUsername } })
	}

	changeName = (e) => {
		this.setState({ initUsername: e.target.value })
	}

	log = () => {
		const { socket } = this.state
		if (socket) socket.emit("log")
	}

	render() {
		const { user, initUsername, curRoomRID, myRooms, myDMs, roomsShown } = this.state
		return (
			<Root>
				{user?.uname ? (
					<>
						<ChatNav
							myDMs={myDMs}
							myRooms={myRooms}
							curRoomRID={curRoomRID}
							createRoom={this.createRoom}
							joinRoom={this.joinRoom}
							deleteRoom={this.deleteRoom}
							sendDM={this.sendDM}
							user={user}
						/>
						<Main>
							<Logs data={myRooms ? myRooms[curRoomRID] : null} user={user} sendDM={this.sendDM} />
							<ChatInput socketSendRoomMsg={this.socketSendRoomMsg} roomsShown={roomsShown} />
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
				<div style={{ position: "absolute", left: "50%", top: "8px" }}>
					<Button variant="outline" onClick={this.log}>
						log
					</Button>
				</div>
			</Root>
		)
	}
}

Chat.contextType = Contexts.AppNav
Chat.shared = setupAppSharedOptions({
	title: "Chat",
	logo: ChatSVG,
	theme: themes.red,
	authRequired: false,
})

export default Chat
