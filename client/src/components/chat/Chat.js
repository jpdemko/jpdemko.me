import * as React from "react"
import styled from "styled-components/macro"
import socketIOClient from "socket.io-client"

import { setupAppSharedOptions, themes, Contexts, ls } from "../../shared/shared"
import { ReactComponent as ChatSVG } from "../../shared/assets/icons/chat.svg"
import ChatNav from "./ChatNav"
import Logs from "./Logs"
import Messaging from "./Messaging"
import { Input } from "../ui/IO"
import Button from "../ui/Button"

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

// const msgIDs = new Set()
// let chatrooms = {}

class Chat extends React.Component {
	constructor(props) {
		super(props)
		this.timeChatOpened = new Date().getTime()
		const prevData = this.getUserData()
		this.state = {
			curRoomRID: null,
			curDMid: null,
			myRooms: null,
			myDMs: null,
			user: null,
			initUsername: "",
			roomsView: true,
			...prevData,
			socket: socketIOClient(process.env.REACT_APP_SERVER_URL),
		}
		this.initUsernameRef = React.createRef()
	}

	componentDidMount() {
		const { socket, user } = this.state
		socket.on("updateRoom", this.updateRoom)
		socket.on("reconnect", () => {
			console.log("client socket.io reconnect event fired - loadUser() called")
			this.loadUser()
		})
		socket.on("disconnect", (reason) => {
			console.log(`socket#${socket.id} disconnect event, reason: ${reason}`)
		})
		window.addEventListener("beforeunload", this.saveUserData)
		this.loadUser()
		if (!user && this.initUsernameRef.current) this.initUsernameRef.current.focus({ preventScroll: true })
	}

	componentWillUnmount() {
		if (this.state.socket) this.state.socket.disconnect()
		this.saveUserData()
		window.removeEventListener("beforeunload", this.saveUserData)
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

	updateRoom = (data) => {
		let { rid, msgs, activeUsers } = data
		let myRooms = { ...this.state.myRooms }
		let room = myRooms[rid]
		if (msgs) room.msgs = { ...room.msgs, ...msgs }
		if (activeUsers) room.activeUsers = activeUsers
		this.setState({ myRooms })
	}

	loadUser = (passedData) => {
		let { user, curRoomRID, myRooms } = passedData ?? this.state
		if (!user) return console.log("loadUser() skipped, no user found")

		console.log("loadUser() start")
		this.context.setIsLoading(true)
		this.socketSetupUser(user)
			.then(async ({ data }) => {
				// { user, myRooms, myDMs } = data
				user = data.user
				myRooms = { ...data.myRooms, ...(myRooms && myRooms) }
				try {
					const joinRoomPromises = Object.keys(myRooms).map((rid) =>
						this.socketJoinRoom(myRooms[rid], user)
					)
					const roomsRes = await Promise.all(joinRoomPromises)
					let loadedRooms = roomsRes.reduce((acc, curRes) => {
						if (curRes) acc[curRes.room.rid] = curRes.room
						return acc
					}, {})
					this.setState({ myRooms: { ...myRooms, ...loadedRooms }, curRoomRID: curRoomRID ?? 1, user })
				} catch (error) {
					console.log(error)
					throw Error(error)
				}
			})
			.catch((err) => {
				console.log(err)
				this.setState({ user: null, curRoomRID: null, curDMid: null, myRooms: null, myDMs: null })
			})
			.finally(() => this.context.setIsLoading(false))
	}

	saveUserData = () => {
		if (!this.state.user || !this.state.myRooms)
			return console.log("saveUserData() skipped, not enough data")
		// let prevData = sessionStorage.getItem("Chat")
		// prevData = prevData ? JSON.parse(prevData) : {}
		// sessionStorage.setItem(
		// 	"Chat",
		// 	JSON.stringify({
		// 		...prevData,
		// 		...this.state,
		// 	})
		// )
		// msgIDs.clear()
		// chatrooms = {}
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
				console.log(success || error, data)
				if (error) reject(error)
				else if (success) resolve({ success, data })
			})
		})
	}

	socketJoinRoom = (room, passedUser) => {
		console.log("socketJoinRoom params: ", room, passedUser)
		let user = passedUser ?? this.state.user
		let { rid, password, msgs } = room

		if (!this.state.socket || !user || !rid) {
			console.log("user: ", user, "rid#:", rid)
			return Promise.reject({ error: "client error - socketJoinRoom() - bad params" })
		}

		return new Promise((resolve, reject) => {
			const ioVars = {
				uid: user.uid,
				rid,
				password,
			}
			if (msgs) {
				const mids = Object.keys(msgs)
				ioVars.lastMsgTS = msgs[mids[mids.length - 1]].created_at
			} else msgs = {}
			this.state.socket.emit("joinRoom", ioVars, ({ success, error, room: roomRes }) => {
				console.log(success || error, roomRes)
				if (error) reject({ error })
				else if (success && roomRes) {
					roomRes.msgs = { ...msgs, ...roomRes.msgs }
					roomRes.unread = Object.keys(roomRes.msgs).length
					resolve({ success, room: roomRes })
				}
			})
		})
	}

	joinRoom = (room) => {
		if (!room?.rid) return Promise.reject({ error: "client error - joinRoom() - no rid# provided" })

		const { rid } = room
		let { curRoomRID, myRooms } = this.state

		if (rid === curRoomRID) {
			return Promise.reject({ error: "client error - joinRoom() - already in that room" })
		} else {
			return this.socketJoinRoom(room).then((res) => {
				let { room: roomRes } = res
				roomRes.unread = 0
				this.updateRoom(roomRes)
				// myRooms = { ...myRooms, [roomRes.rid]: roomRes }
				// this.setState({ myRooms, curRoomRID: rid })
				return res
			})
		}
	}

	deleteRoom = (rid) => {
		const { curRoomRID, socket, user, myRooms } = this.state
		if (rid === 1) return console.log("deleteRoom() - can't delete 'General'")

		new Promise((resolve, reject) => {
			socket.emit("deleteRoom", { uid: user.uid, rid }, ({ success, error }) => {
				console.log(success || error)
				if (error) reject({ error })
				else resolve({ success })
			})
		})
			.then(async () => {
				console.log(`client deleteRoom(${rid}) start`)
				if (curRoomRID === rid) {
					try {
						await this.joinRoom(myRooms.find((r) => r.rid !== rid))
					} catch (error) {
						throw Error(error)
					}
				}
				this.setState({ myRooms: myRooms.filter((r) => r.rid !== rid) })
			})
			.catch(console.log)
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
				console.log(error || success, roomRes)
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

	socketSendMsg = (msg) => {
		const { socket, curRoomRID, user } = this.state
		return new Promise((resolve) => {
			socket.emit("sendMsg", { msg, rid: curRoomRID, uid: user.uid }, ({ error, success, msgs }) => {
				console.log(success || error, msgs)
				if (success && msgs) resolve({ success, msgs })
			})
		})
	}

	socketSendDM = (msg) => {}

	send = (msg) => {
		const { curRoomRID } = this.state
		return this.socketSendMsg(msg).then((res) => {
			const { msgs } = res
			this.updateRoom({ rid: curRoomRID, msgs })
			return res
		})
	}

	submitName = (e) => {
		e.preventDefault()
		const { initUsername } = this.state
		this.loadUser({ user: { uname: initUsername } })
	}

	changeName = (e) => {
		this.setState({ initUsername: e.target.value })
	}

	setRoomsView = (bool = true) => {
		this.setState({ roomsView: bool })
	}

	log = () => {
		const { socket } = this.state
		// console.log("chatrooms: ", chatrooms, "\nmsgs: ", msgIDs)
		if (socket) socket.emit("log")
	}

	render() {
		const { user, initUsername, curRoomRID, myRooms, myDMs } = this.state
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
							user={user}
						/>
						<Main>
							<Logs data={curRoomRID} user={user} />
							<Messaging send={this.send} />
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
