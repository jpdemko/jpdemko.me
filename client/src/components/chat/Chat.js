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

const msgIDs = new Set()
let chatrooms = {}

class Chat extends React.Component {
	constructor(props) {
		super(props)
		this.timeChatOpened = new Date().getTime()
		const prevData = this.getUserData()
		this.state = {
			curRoom: null,
			roomsData: null,
			user: null,
			inputUsername: "",
			roomsView: true,
			...prevData,
			socket: socketIOClient(process.env.REACT_APP_SERVER_URL),
		}
		this.inputUsernameRef = React.createRef()
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
		if (!user && this.inputUsernameRef.current) this.inputUsernameRef.current.focus({ preventScroll: true })
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

	loadUser = (prevState) => {
		let { user, curRoom } = prevState || this.state
		if (!user) return console.log("loadUser() skipped, no user found")

		console.log("loadUser() start")
		this.context.setIsLoading(true)
		this.socketSetupUser(user)
			.then(async ({ user }) => {
				const { joinedRooms } = user
				const room = curRoom || joinedRooms?.[0]
				if (room) {
					try {
						const res = await this.socketJoinRoom(room, user)
						this.updateRoom(res.room)
					} catch (error) {
						throw Error(error)
					}
					this.setState({
						user,
						curRoom: { ...chatrooms[curRoom?.rid ?? 1] },
						roomsData: joinedRooms,
					})
				}
			})
			.catch((err) => {
				console.log(err)
				this.setState({ user: null, curRoom: null, roomsData: null })
			})
			.finally(() => this.context.setIsLoading(false))
	}

	saveUserData = () => {
		const { user, curRoom, roomsData, roomsView } = this.state
		if (!user || !curRoom || !roomsData) return console.log("saveUserData() skipped, not enough data")
		let prevData = sessionStorage.getItem("Chat")
		prevData = prevData ? JSON.parse(prevData) : {}
		sessionStorage.setItem(
			"Chat",
			JSON.stringify({
				...prevData,
				user,
				curRoom,
				roomsData,
				roomsView,
			})
		)
		msgIDs.clear()
		chatrooms = {}
	}

	socketSetupUser = (nextUser) => {
		const { socket, user } = this.state
		if (!nextUser && user) nextUser = user
		return new Promise((resolve, reject) => {
			if (!socket || !nextUser) {
				reject({ error: "client error - socketSetupUser() - bad vars" })
				return
			}
			socket.emit("setupUser", { uname: nextUser.uname }, ({ success, error, user }) => {
				console.log(success || error, user)
				if (error) reject(error)
				else if (success) resolve({ success, user })
			})
		})
	}

	updateRoom = (room, makeCurRoom = false) => {
		if (!room) return
		const { rid, rname, password, activeUsers, msgs } = room
		// Update globals.
		if (!chatrooms[rid]) {
			chatrooms[rid] = {
				rid,
				rname,
				password,
				activeUsers,
				msgs: [],
				timeRoomOpened: new Date().getTime(),
			}
		}
		if (activeUsers) chatrooms[rid].activeUsers = activeUsers
		if (msgs) {
			msgs.forEach((msg) => {
				if (!msgIDs.has(msg.mid)) {
					msgIDs.add(msg.mid)
					chatrooms[rid].msgs.push(msg)
				}
			})
		}
		// Update state based on certain factors.
		const { curRoom, roomsData } = this.state
		const nextState = {}
		if (makeCurRoom || curRoom?.rid === rid) {
			nextState.curRoom = { ...chatrooms[rid] }
		}
		if (!roomsData?.find((r) => r.rid === rid)) {
			nextState.roomsData = (roomsData || []).concat([{ rid, rname, password }])
		}
		if (Object.keys(nextState).length > 0) {
			this.setState(nextState)
		}
	}

	socketJoinRoom = (room, passedUser) => {
		let { socket, user } = this.state
		if (passedUser) user = passedUser
		let { rid, password } = room
		if (!socket || !user || !rid) {
			return Promise.reject({ error: "client error - socketJoinRoom() - bad params" })
		}

		return new Promise((resolve, reject) => {
			const { msgs } = chatrooms[rid] || {}
			const ioVars = {
				uid: user.uid,
				rid,
				password,
			}
			if (msgs?.length > 0) ioVars.lastMsgTS = msgs[msgs.length - 1].created_at
			socket.emit("joinRoom", ioVars, ({ success, error, room: roomRes }) => {
				console.log(success || error, roomRes)
				if (error) reject({ error })
				else if (success && roomRes) {
					if (msgs) roomRes.msgs = msgs.concat(roomRes.msgs || [])
					resolve({ success, room: roomRes })
				}
			})
		})
	}

	joinRoom = (room) => {
		if (!room?.rid) return Promise.reject({ error: "client error - joinRoom() - no rid# provided" })

		const { rid } = room
		const { curRoom } = this.state

		if (rid === curRoom?.rid) {
			return Promise.reject({ error: "client error - joinRoom() - already in that room" })
		} else {
			return this.socketJoinRoom(room).then((res) => {
				const { room: roomRes } = res
				this.updateRoom(roomRes, true)
				return res
			})
		}
	}

	deleteRoom = (rid) => {
		const { curRoom, socket, user, roomsData } = this.state
		if (!roomsData?.find((r) => r.rid === rid)) return console.log("deleteRoom() - room doesn't exist")
		else if (rid === 1) return console.log("deleteRoom() - can't delete 'General'")

		new Promise((resolve, reject) => {
			socket.emit("deleteRoom", { uid: user.uid, rid }, ({ success, error }) => {
				console.log(success || error)
				if (error) reject({ error })
				else resolve({ success })
			})
		})
			.then(async () => {
				console.log(`client deleteRoom(${rid}) start`)
				if (chatrooms[rid]) {
					chatrooms[rid].msgs.forEach((msg) => msgIDs.delete(msg.mid))
					delete chatrooms[rid]
				}
				if (curRoom?.rid === rid) {
					try {
						await this.joinRoom(roomsData.find((r) => r.rid !== rid))
					} catch (error) {
						throw Error(error)
					}
				}
				this.setState({ roomsData: roomsData.filter((r) => r.rid !== rid) })
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
		const { socket, curRoom, user } = this.state
		return new Promise((resolve) => {
			socket.emit("sendMsg", { msg, rid: curRoom.rid, uid: user.uid }, ({ error, success, msgs }) => {
				console.log(success || error, msgs)
				if (success && msgs) resolve({ success, msgs })
			})
		})
	}

	sendMsg = (msg) => {
		const { rid } = this.state.curRoom
		return this.socketSendMsg(msg).then((res) => {
			const { msgs } = res
			this.updateRoom({ ...chatrooms[rid], msgs })
			return res
		})
	}

	submitName = (e) => {
		e.preventDefault()
		const { inputUsername } = this.state
		this.loadUser({ user: { uname: inputUsername } })
	}

	changeName = (e) => {
		this.setState({ inputUsername: e.target.value })
	}

	setRoomsView = (bool = true) => {
		this.setState({ roomsView: bool })
	}

	log = () => {
		const { socket } = this.state
		console.log("chatrooms: ", chatrooms, "\nmsgs: ", msgIDs)
		if (socket) socket.emit("log")
	}

	render() {
		const { user, inputUsername, curRoom, roomsData } = this.state
		return (
			<Root>
				{user?.uname ? (
					<>
						<ChatNav
							roomsData={roomsData}
							curRoom={curRoom}
							createRoom={this.createRoom}
							joinRoom={this.joinRoom}
							deleteRoom={this.deleteRoom}
							user={user}
						/>
						<Main>
							<Logs curRoom={curRoom} user={user} />
							<Messaging sendMsg={this.sendMsg} disabled={!!!curRoom} />
						</Main>
						<div style={{ position: "absolute", left: "50%", top: "0" }}>
							<Button onClick={this.log}>log</Button>
						</div>
					</>
				) : (
					<form onSubmit={this.submitName}>
						<label>
							Enter name:{" "}
							<Input
								type="text"
								value={inputUsername}
								onChange={this.changeName}
								minLength="1"
								required
								ref={this.inputUsernameRef}
							/>
						</label>
						<Button type="submit" variant="fancy">
							Submit
						</Button>
					</form>
				)}
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
