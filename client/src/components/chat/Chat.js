import * as React from "react"
import styled from "styled-components/macro"
import socketIOClient from "socket.io-client"
import { DateTime } from "luxon"

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

/*
- Setup user in db (whether that is creating new user or retrieving old one)
	* Once user data is returned I need see if there is old saved data available in localstorage.
		- If saved data:
			* Load stale data and wait for up to date info: DMs, previous rooms and all encompassing msgs.

- Once stale data loaded into UI. Go ahead and start queries to check for up to data info.
	* Compare old rooms joined to fresh db query of their currently joined rooms.
	* Once room list updated. Fetch messages for all rooms. Use last msg or if no data get default past 60 days.

- At this point the UI should be updated w/ any new data and updates. React to user input.
	* Create room
	* Join room
	* Send DM
*/

class Chat extends React.Component {
	constructor(props) {
		super(props)
		this.timeOpened = DateTime.local()
		const prevData = this.getUserData()
		this.state = {
			curRoom: null,
			roomsData: null,
			user: null,
			inputUsername: "",
			...prevData,
			socket: socketIOClient(process.env.REACT_APP_SERVER_URL),
		}
		this.inputUsernameRef = React.createRef()
	}

	componentDidMount() {
		const { socket, user } = this.state
		socket.on("reconnect", this.reconnect)
		socket.on("updateRoom", this.updateRoom)
		socket.on("reconnect", this.loadUser)
		socket.on("disconnect", (reason) => {
			console.log("client socket.io disconnect event, reason: ", reason)
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

	reconnect = () => {
		const { user, socket } = this.state
		if (!user || !socket) return
		console.log("socket reconnect event completed, loadUser() started")
		this.loadUser()
	}

	getUserData = (passedUser) => {
		// let { user, curRoom, roomsData } = ls.get("Chat") || {}
		let prevData = sessionStorage.getItem("Chat")
		prevData = prevData ? JSON.parse(prevData) : {}
		let { user, curRoom, roomsData } = prevData
		if (passedUser) user = passedUser
		const output = {
			user,
			curRoom,
			roomsData,
		}
		console.log("getUserData() output: ", output)
		return output
	}

	loadUser = (prevState) => {
		let { user, roomsData, curRoom } = prevState || this.state
		if (!user) return console.log("loadUser() failed", prevState || this.state)

		console.log("loadUser() started, loading: true", user, roomsData, curRoom)
		this.context.setIsLoading(true)
		this.socketSetupUser(user)
			.then(async ({ success, user }) => {
				if (!success) throw new Error("Couldn't load user...")
				const { uid, uname, pid, email, created_at, joinedRooms } = user
				// If prev data found, use that, otherwise just use the user's joined rooms from DB.
				const rooms = roomsData?.length >= joinedRooms?.length ? roomsData : joinedRooms
				// Grab data for all the rooms (msgs/user).
				const data = await Promise.all(rooms.map((room) => this.socketJoinRoom(room, user)))
				// Used for joinRoom() comparisons later. Prevents queries to server/DB to fetch data.
				this.timeRoomsLoaded = DateTime.local()
				// Sort through data and make sure all is unique.
				data.forEach(({ room }) => this.updateGlobals(room))
				const nextState = {
					user,
					curRoom: { ...chatrooms[curRoom?.rid ?? 1] },
					roomsData: Object.keys(chatrooms).map((rid) => ({ ...chatrooms[rid] })),
				}
				console.log("loadUser() nextState: ", nextState)
				this.setState(nextState)
			})
			.catch((err) => {
				console.log(err)
				this.setState({ user: undefined, curRoom: undefined, roomsData: undefined })
			})
			.finally(() => this.context.setIsLoading(false))
	}

	saveUserData = () => {
		const { curRoom, user } = this.state
		// const prevData = ls.get("Chat")
		// ls.set("Chat", {
		// 	...prevData,
		// 	user,
		// 	curRoom,
		// 	roomsData: Object.keys(chatrooms).map((rid) => ({ ...chatrooms[rid] })),
		// })
		let prevData = sessionStorage.getItem("Chat")
		prevData = prevData ? JSON.parse(prevData) : {}
		sessionStorage.setItem(
			"Chat",
			JSON.stringify({
				...prevData,
				user,
				curRoom,
				roomsData: Object.keys(chatrooms).map((rid) => ({ ...chatrooms[rid] })),
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
				reject({ error: "CLIENT ERROR - SETUP USER - INVALID VARS" })
				return
			}
			socket.emit("setupUser", { uname: nextUser.uname }, ({ success, error, user }) => {
				console.log(success || error, user)
				if (error) reject(error)
				else if (success) resolve({ success, user })
			})
		})
	}

	updateGlobals = ({ rid, rname, password, activeUsers, msgs }) => {
		if (!chatrooms[rid]) {
			chatrooms[rid] = {
				rid,
				rname,
				password,
				activeUsers,
				msgs: [],
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
	}

	updateRoom = (passedRoom, makeCurRoom = false) => {
		if (!passedRoom) return console.log("updateRoom() bad room param.", passedRoom)
		const { curRoom, roomsData } = this.state

		console.log("updateRoom() room: ", passedRoom)
		this.updateGlobals(passedRoom)
		const nextState = {}
		if (makeCurRoom || curRoom?.rid === passedRoom.rid) {
			console.log(`updateRoom() replacing curRoom(${curRoom?.rid}) with room(${passedRoom.rid})`)
			nextState.curRoom = { ...chatrooms[passedRoom.rid] }
		}
		if (!roomsData?.find((r) => r.rid === passedRoom.rid)) {
			console.log("updateRoom() room joined not in roomData state, adding it to state")
			nextState.roomsData = Object.keys(chatrooms).map((rid) => ({ ...chatrooms[rid] }))
		}
		if (Object.keys(nextState).length > 0) {
			console.log("updateRoom() setstate called")
			this.setState(nextState)
		}
	}

	socketJoinRoom = (room, passedUser) => {
		let { rid, password } = room
		if (password?.length < 1) password = null
		let { socket, user, roomsData } = this.state
		if (passedUser) user = passedUser
		if (!socket || !user || !rid) {
			console.log(`socket:${!!socket}, user:${!!user}, rid:${!!rid}`)
			return Promise.reject({ error: "error - socketJoinRoom() - bad params" })
		}

		return new Promise((resolve, reject) => {
			const { msgs } = chatrooms[rid] || roomsData?.find((r) => r.rid === rid) || {}
			const ioVars = {
				uid: user.uid,
				rid,
				password,
			}
			if (msgs?.length > 0) ioVars.lastMsgTS = msgs[msgs.length - 1].created_at
			console.log("socketJoinRoom() vars: ", ioVars)
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
		const { rid } = room
		if (!rid) return Promise.reject({ error: "error - cojRoom() - bad params" })

		const { roomsData, curRoom } = this.state
		const alreadyJoinedRoom = roomsData?.find((r) => r.rid === rid)
		const sameRoom = alreadyJoinedRoom && curRoom?.rid === alreadyJoinedRoom?.rid
		if (alreadyJoinedRoom && this?.timeRoomsLoaded > this.timeOpened) {
			return new Promise((resolve, reject) => {
				if (sameRoom) return reject({ error: "error - joinRoom() - can't join room you're already in" })
				else {
					const nextRoom = { ...chatrooms[room.rid] }
					this.setState({ curRoom: nextRoom })
					return resolve({ success: `success - joinRoom() - joined ${room.rname}`, room: nextRoom })
				}
			})
		} else if (!alreadyJoinedRoom) {
			return this.socketJoinRoom(room).then((res) => {
				const { room: roomRes } = res
				this.updateRoom(roomRes, true)
				return res
			})
		}
	}

	leaveRoom = (rid) => {
		if (!chatrooms[rid]) return console.log("leaveRoom() room doesn't exist")
		else if (rid === 1) return console.log("leaveRoom() can't leave 'General'")
		const { curRoom, socket, user } = this.state
		new Promise((resolve, reject) => {
			socket.emit("leaveRoom", { uid: user.uid, rid }, ({ success, error }) => {
				console.log(success || error)
				if (error) reject({ error })
				else resolve({ success })
			})
		})
			.then((res) => {
				console.log(`leaveRoom(${rid})`)
				chatrooms[rid].msgs.forEach((msg) => msgIDs.delete(msg.mid))
				delete chatrooms[rid]
				console.log(chatrooms, msgIDs)
				const nextState = {}
				nextState.roomsData = Object.keys(chatrooms).map((rid) => ({ ...chatrooms[rid] }))
				if (curRoom?.rid === rid) {
					const nextRID = Object.keys(chatrooms).find((rid) => rid)
					nextState.curRoom = nextRID ? { ...chatrooms[nextRID] } : null
				}
				// console.log("leaveRoom() setState called")
				this.setState(nextState)
			})
			.catch()
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
		return this.socketCreateRoom(room).then(({ success, room: roomRes }) => {
			// console.log(res)
			this.updateRoom(roomRes, true)
			return roomRes
		})
	}

	socketSendMsg = (msg) => {
		const { socket, curRoom, user } = this.state
		return new Promise((resolve, reject) => {
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
		// this.context.setIsLoading(true)
		// this.socketSetupUser({ uname: inputUsername })
		// 	.then(({ success, user }) => this.loadUser(this.getUserData(user)))
		// 	.catch((error) => this.setState({ inputUsername: error }))
		this.loadUser({ user: { uname: inputUsername } })
	}

	changeName = (e) => {
		this.setState({ inputUsername: e.target.value })
	}

	log = () => {
		new Promise((resolve, reject) => {
			this.state.socket.emit("log", (res) => {
				resolve(res)
			})
		}).then((res) => {
			console.log("SERVER: ", res)
			console.log("- - - - - -\nCLIENT: ", chatrooms)
		})
	}

	render() {
		console.count("--- <Chat /> rendered ---")
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
							leaveRoom={this.leaveRoom}
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
