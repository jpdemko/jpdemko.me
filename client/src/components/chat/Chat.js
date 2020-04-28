import * as React from "react"
import styled from "styled-components/macro"
import socketIOClient from "socket.io-client"
import { DateTime } from "luxon"

import { setupAppSharedOptions, themes, Contexts } from "../../shared/shared"
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
		this.timeOpened = DateTime.local()
		this.state = {
			curRoom: null,
			roomsData: null,
			user: null,
			inputUsername: "",
			socket: socketIOClient(process.env.REACT_APP_SERVER_URL),
			...this.getUserData(),
		}
	}

	componentDidMount() {
		const { socket } = this.state
		socket.on("updateRoom", this.updateRoom)
		socket.on("reconnect", this.loadUser)
		window.addEventListener("beforeunload", this.saveUserData)
		this.loadUser()
	}

	componentWillUnmount() {
		if (this.state.socket) this.state.socket.disconnect()
		this.saveUserData()
		window.removeEventListener("beforeunload", this.saveUserData)
	}

	componentDidUpdate(prevProps, prevState) {
		const { user } = this.state
		if (prevState.user?.name !== user?.name) this.loadUser()
	}

	getUserData = (user) => {
		if (!user) {
			user = sessionStorage.getItem("Chat-user")
			user = user ? JSON.parse(user) : null
		}
		let prevState = {}
		if (user) {
			const generalChat = {
				name: "General",
				password: undefined,
				users: [],
				msgs: [],
			}
			prevState = sessionStorage.getItem(`Chat-${user?.name}-state`)
			prevState = prevState
				? JSON.parse(prevState)
				: {
						curRoom: generalChat,
						roomsData: [generalChat],
				  }
		}
		return {
			user,
			...prevState,
		}
	}

	loadUser = (prevState) => {
		const { user, roomsData, curRoom } = prevState || this.state
		if (!user) return console.log("loadUser() failed, no user")
		console.log("loadUser() started, loading: true", user, roomsData, curRoom)
		this.context.setIsLoading(true)
		let nextState = {}
		this.socketSetupUser(user)
			.then(async ({ success, user }) => {
				if (!success) throw new Error("Couldn't load user...")

				nextState = {
					user,
				}
				const data = await Promise.all(roomsData.map((room) => this.socketJoinRoom(room, user)))
				console.log("loadUser() - user had prev data.", data)
				this.timeRoomsLoaded = DateTime.local()
				data.forEach(({ room }) => this.updateGlobals(room))
				console.log("checking globals", chatrooms, msgIDs)
				nextState = {
					...nextState,
					curRoom: { ...chatrooms[curRoom.name] },
					roomsData: Object.keys(chatrooms).map((rname) => ({ ...chatrooms[rname] })),
				}
				console.log("loadUser() socketSetup success. Setting state now.")
				this.setState(nextState)
			})
			.catch()
			.finally(() => this.context.setIsLoading(false))
	}

	saveUserData = () => {
		const { curRoom, roomsData, user } = this.state
		if (!user?.name) return console.log("saveUserData() skipped, no user to save.")
		console.log("saveUserData()")
		sessionStorage.setItem("Chat-user", JSON.stringify(user))
		const nextRoomsData = Object.keys(chatrooms).map((rname) => ({ ...chatrooms[rname] }))
		msgIDs.clear()
		chatrooms = {}
		if (!roomsData || !curRoom) return
		sessionStorage.setItem(`Chat-${user.name}-state`, JSON.stringify({ curRoom, roomsData: nextRoomsData }))
	}

	socketSetupUser = (nextUser) => {
		const { socket, user } = this.state
		if (!nextUser && user) nextUser = user
		return new Promise((resolve, reject) => {
			if (!socket || !nextUser) {
				reject({ error: "CLIENT ERROR - SETUP USER - INVALID VARS" })
				return
			}
			socket.emit("setupUser", nextUser.name, ({ success, error, user }) => {
				console.log(success || error, user)
				if (error) reject(error)
				else if (success) resolve({ success, user })
			})
		})
	}

	updateGlobals = ({ name, password, users, msgs }) => {
		if (!chatrooms[name]) {
			chatrooms[name] = {
				name,
				password,
				users,
				msgs: [],
			}
		}
		if (users) chatrooms[name].users = users
		if (msgs) {
			msgs.forEach((msg) => {
				if (!msgIDs.has(msg.mid)) {
					msgIDs.add(msg.mid)
					chatrooms[name].msgs.push(msg)
				}
			})
		}
	}

	updateRoom = (room, makeCurRoom = true) => {
		if (!room) return console.log("updateRoom() bad room param.")
		const { curRoom, roomsData } = this.state

		this.updateGlobals(room)
		const nextState = {}
		if (makeCurRoom || curRoom?.name === room.name) {
			console.log(`updateRoom() replacing curRoom(${curRoom?.name}) with room(${room.name})`)
			nextState.curRoom = { ...chatrooms[room.name] }
		}
		if (!roomsData?.find((r) => r.name === room.name)) {
			console.log("updateRoom() room joined not in roomData state, adding it to state")
			nextState.roomsData = Object.keys(chatrooms).map((rname) => ({ ...chatrooms[rname] }))
		}
		if (Object.keys(nextState).length > 0) {
			console.log("updateRoom() setstate called")
			this.setState(nextState)
		}
	}

	socketJoinRoom = ({ name, password }, passedUser) => {
		let { socket, user, roomsData } = this.state
		if (passedUser) user = passedUser
		return new Promise((resolve, reject) => {
			if (!socket || !user || !name) {
				console.log(socket, user, name)
				return reject({ error: "CLIENT ERROR - JOIN ROOM - INVALID VARS" })
			}

			const { msgs } = chatrooms[name] || roomsData?.find((r) => r.name === name) || {}
			const ioVars = {
				username: user.name,
				roomName: name,
				password,
			}
			if (msgs?.length > 0) ioVars.lastMsgTS = msgs[msgs.length - 1].msg_created_at
			socket.emit("joinRoom", ioVars, ({ success, error, room }) => {
				console.log(success || error, room)
				if (error) reject({ error })
				else if (success && room) {
					if (msgs) room.msgs = msgs.concat(room.msgs || [])
					resolve({ success, room })
				}
			})
		})
	}

	joinRoom = (room) => {
		if (!room) return console.log("joinRoom() bad room param.")
		const { roomsData, curRoom } = this.state
		const alreadyJoinedRoom = roomsData?.find((r) => r.name === room?.name)
		const sameRoom = alreadyJoinedRoom && curRoom?.name === alreadyJoinedRoom?.name
		if (alreadyJoinedRoom && this?.timeRoomsLoaded > this.timeOpened) {
			return new Promise((resolve, reject) => {
				if (sameRoom) return reject({ error: "ERROR: YOU'RE TRYING TO JOIN ROOM YOU'RE CURRENTLY IN" })
				else {
					const nextRoom = { ...chatrooms[room.name] }
					this.setState({ curRoom: nextRoom })
					return resolve({ success: `SUCCESS - JOINED ROOM(${nextRoom.name})`, room: nextRoom })
				}
			})
		}
		return this.socketJoinRoom(room).then((res) => {
			const { success, room: roomRes } = res
			this.updateRoom(roomRes)
			return {
				success,
				room: roomRes,
			}
		})
	}

	leaveRoom = (name) => {
		if (!chatrooms[name]) return console.log("leaveRoom() room doesn't exist")
		else if (name === "General") return console.log("leaveRoom() can't leave 'General'")
		const { curRoom, socket, user } = this.state

		chatrooms[name].msgs.forEach((msg) => msgIDs.delete(msg.mid))
		delete chatrooms[name]
		console.log(`leaveRoom(${name})`)
		console.log(chatrooms, msgIDs)
		const nextState = {}
		nextState.roomsData = Object.keys(chatrooms).map((rname) => ({ ...chatrooms[rname] }))
		if (curRoom?.name === name) {
			const nextRoom = nextState.roomsData.find((r) => r.name)
			nextState.curRoom = nextRoom ? { ...chatrooms[nextRoom.name] } : null
		}
		this.setState(nextState)
		socket.emit("leaveRoom", { username: user.name, roomName: name }, ({ success, error }) => {
			console.log(success || error)
		})
	}

	socketSendMsg = (msg) => {
		const { socket, curRoom, user } = this.state
		return new Promise((resolve, reject) => {
			socket.emit(
				"sendMsg",
				{ msg, roomName: curRoom.name, uid: user.uid },
				({ error, success, msgs }) => {
					console.log(success || error, msgs)
					if (success && msgs) resolve({ success, msgs })
				}
			)
		})
	}

	sendMsg = (msg) => {
		const { curRoom } = this.state
		return this.socketSendMsg(msg).then((res) => {
			const { msgs } = res
			this.updateRoom({ name: curRoom.name, password: curRoom.password, msgs })
			return res
		})
	}

	submitName = (e) => {
		e.preventDefault()
		const { inputUsername } = this.state
		this.context.setIsLoading(true)
		this.socketSetupUser({ name: inputUsername })
			.then(({ success, user }) => {
				this.loadUser(this.getUserData(user))
			})
			.catch((error) => {
				this.setState({ inputUsername: error })
			})
	}

	changeName = (e) => {
		this.setState({ inputUsername: e.target.value })
	}

	render() {
		console.count("--- <Chat /> rendered ---")
		const { user, inputUsername, curRoom, roomsData } = this.state
		return (
			<Root>
				{user?.name ? (
					<>
						<ChatNav
							roomsData={roomsData}
							curRoom={curRoom}
							joinRoom={this.joinRoom}
							leaveRoom={this.leaveRoom}
							user={user}
						/>
						<Main>
							<Logs curRoom={curRoom} user={user} />
							<Messaging sendMsg={this.sendMsg} disabled={!!!curRoom} />
						</Main>
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
