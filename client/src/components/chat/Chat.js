import React from "react"
import styled, { css } from "styled-components/macro"
import socketIOClient from "socket.io-client"

import { setupAppSharedOptions, createTheme, themes } from "../../shared/shared"
import { ReactComponent as ChatSVG } from "../../shared/assets/icons/chat.svg"
import ChatNav from "./ChatNav"
import UserList from "./UserList"
import Messaging from "./Messaging"

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div`
	display: flex;
`

/* -------------------------------- COMPONENT ------------------------------- */

/**
 * @typedef User
 * @property {string} socketID
 * @property {number} dbID
 * @property {Array<string>} rooms
 * @property {string} name
 */

/**
 * @typedef Room
 * @property {string} name
 * @property {Array<User>} users
 * @property {string} [password]
 */

const msgIDs = new Set()
let chatrooms = {}

class Chat extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			curRoom: null,
			roomsData: null,
			user: null,
			inputUsername: "",
			socket: socketIOClient(process.env.REACT_APP_SERVER_URL),
		}
	}

	componentDidMount() {
		const { socket } = this.state
		socket.on("updateRoom", this.updateRoom)
		socket.on("reconnect", this.loadUserData)
		window.addEventListener("beforeunload", this.saveUserData)
		this.loadUserData()
	}

	componentWillUnmount() {
		if (this.state.socket) this.state.socket.disconnect()
		this.saveUserData()
		window.removeEventListener("beforeunload", this.saveUserData)
	}

	componentDidUpdate(prevProps, prevState) {
		const { user, roomsData } = this.state
		if (prevState.user?.name !== user?.name) this.loadUserData()
		if (!prevState.roomsData && roomsData) this.joinPrevRooms()
	}

	loadUserData = (prevUser) => {
		prevUser = this.state.user || JSON.parse(sessionStorage.getItem("Chat-user") || "{}")
		if (!prevUser?.name) return
		this.setupUser(prevUser)
			.then(({ success, user }) => {
				this.setState({
					roomsData: [],
					user,
					...JSON.parse(sessionStorage.getItem(`Chat-${user?.name}-state`) || "{}"),
				})
			})
			.catch()
	}

	saveUserData = () => {
		const { curRoom, roomsData, user } = this.state
		if (!user?.name) return
		sessionStorage.setItem("Chat-user", JSON.stringify(user))
		const nextRoomsData = Object.keys(chatrooms).map((rname) => ({ ...chatrooms[rname] }))
		msgIDs.clear()
		chatrooms = {}
		if (!roomsData || !curRoom) return
		sessionStorage.setItem(`Chat-${user.name}-state`, JSON.stringify({ curRoom, roomsData: nextRoomsData }))
	}

	/**
	 * @param {string} name
	 * @return {Promise<Object<string, User>>}
	 */
	setupUser = (nextUser) => {
		const { socket, user } = this.state
		if (!nextUser && user) nextUser = user
		return new Promise((resolve, reject) => {
			if (!socket || !nextUser) {
				reject({ error: "CLIENT ERROR - SETUP USER - INVALID VARS" })
				return
			}
			socket.emit("setupUser", nextUser.name, ({ success, error, user }) => {
				console.log(success || error)
				if (error) reject(error)
				else if (success) resolve({ success, user })
			})
		})
	}

	/**
	 * @param {Room} room
	 */
	updateRoom = ({ name, password, users, msgs }) => {
		if (!name) return
		const { curRoom } = this.state
		if (!chatrooms[name]) {
			chatrooms[name] = {
				name,
				password,
				users,
				msgs: [],
			}
		} else {
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
		if (curRoom?.name === name) {
			this.setState({ curRoom: { ...chatrooms[name] } })
		}
	}

	/**
	 * @param {Object} vars
	 * @param {string} vars.name
	 * @param {string} [vars.password]
	 * @param {boolean} [vars.makeCurRoom=false]
	 * @return {Promise}
	 */
	joinRoom = ({ name, password, msgs: oldMsgs }, makeCurRoom = false) => {
		const { socket, user, roomsData, curRoom } = this.state
		const socketVars = {
			username: user.name,
			roomName: name,
			password,
			lastMsgTS: oldMsgs?.length > 0 ? oldMsgs[oldMsgs.length - 1].msg_created_at : null,
		}
		return new Promise((resolve, reject) => {
			if (!socket || !user) {
				reject({ error: "CLIENT ERROR - JOIN ROOM - INVALID VARS" })
				return
			}
			socket.emit("joinRoom", socketVars, ({ success, error, room }) => {
				console.log(success || error)
				if (error) reject({ error })
				else if (success) {
					const nextState = {}
					if (roomsData) {
						const roomAlreadyJoined = roomsData.find((r) => r.name === name)
						if (!roomAlreadyJoined) nextState.roomsData = roomsData.concat([{ name, password }])
					}
					if (makeCurRoom || curRoom?.name === name) nextState.curRoom = chatrooms[name]
					if (Object.keys(nextState).length > 0) this.setState(nextState)
					let { users, msgs } = room
					if (oldMsgs) msgs = msgs.concat(oldMsgs)
					this.updateRoom({ name, password, users, msgs })
					resolve({ success, room })
				}
			})
		})
	}

	joinPrevRooms = () => {
		const { roomsData } = this.state
		Promise.all(roomsData.map(this.joinRoom)).then().catch()
	}

	sendMsg = (msg) => {
		const { socket, curRoom, user } = this.state
		socket.emit("sendMsg", { msg, roomName: curRoom.name, uid: user.uid }, function ({
			error,
			success,
			msgs,
		}) {
			console.log(success || error)
			if (success) {
				this.updateRoom({ name: curRoom.name, password: curRoom.password, msgs })
			}
		})
	}

	submitName = (e) => {
		e.preventDefault()
		const { inputUsername } = this.state
		this.setupUser({ name: inputUsername })
			.then(({ success, user }) => {
				this.setState({ user, inputUsername: "" })
			})
			.catch((error) => {
				this.setState({ inputUsername: error })
			})
	}

	changeName = (e) => {
		this.setState({ inputUsername: e.target.value })
	}

	render() {
		const { user, inputUsername, curRoom, roomsData } = this.state
		return (
			<Root>
				{user?.name ? (
					<>
						<ChatNav roomsData={roomsData} joinRoom={this.joinRoom} />
						<Messaging curRoom={curRoom} sendMsg={this.sendMsg} user={user} />
						<UserList curRoom={curRoom} />
					</>
				) : (
					<form onSubmit={this.submitName}>
						<label>
							Enter name:{" "}
							<input
								type="text"
								value={inputUsername}
								onChange={this.changeName}
								minLength="1"
								required
							/>
						</label>
						<input type="submit" value="Submit" />
					</form>
				)}
			</Root>
		)
	}
}

Chat.shared = setupAppSharedOptions({
	title: "Chat",
	logo: ChatSVG,
	theme: themes.red,
	authRequired: false,
})

export default Chat
