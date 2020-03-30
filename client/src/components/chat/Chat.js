import React from "react"
import styled, { css } from "styled-components/macro"
import socketIOClient from "socket.io-client"

import { addTheme, setupAppSharedOptions } from "../../shared/helpers"
import { ReactComponent as ChatSVG } from "../../shared/assets/icons/chat.svg"
import ChatNav from "./ChatNav"
import UserList from "./UserList"
import Messaging from "./Messaging"

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div`
	display: flex;
	${({ theme }) => css`
		background: lightgreen;
	`}
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

const chatrooms = {}

class Chat extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			curRoom: null,
			joinedRoomNames: [],
			username: null,
			inputUsername: "",
			socket: socketIOClient(process.env.REACT_APP_SERVER_URL),
			...this.loadData(),
		}
	}

	componentDidMount() {
		this.state.socket.on("updateRoom", this.updateRoom)
		window.addEventListener("beforeunload", this.save)
	}

	componentWillUnmount() {
		if (this.state.socket) this.state.socket.disconnect()
		this.save()
		window.removeEventListener("beforeunload", this.save)
	}

	loadData = (username = sessionStorage.getItem("Chat-username")) => {
		if (!username) return
		let prevData = sessionStorage.getItem(`Chat-${username}-data`)
		// figure out what data will be and return it
	}

	joinPrevRooms = () => {
		// Once room names have been set, join them all if any.
		// Promise.all(joinedRooms.map(({ name, password }) => joinRoom(name, password)))
		// 	.then((data) => {
		// 		data.forEach(({ data: { room, msgs } }) => {
		// 			myRooms[room.name] = {
		// 				...room,
		// 				msgs,
		// 			}
		// 			if (focusedRoom.name === room.name) setFocusedRoom({ ...myRooms[room.name] })
		// 		})
		// 	})
		// 	.catch((error) => console.log(`promise.all() load rooms error: ${error}`))
	}

	saveData = () => {
		// Save rooms on unload and unmount.
	}

	/**
	 * @param {string} name
	 * @return {Promise<Object<string, User>>}
	 */
	setupUser = (name) => {
		const { socket, username } = this.state
		if (!name) name = username
		return new Promise((resolve, reject) => {
			if (!socket) {
				reject({ error: "ERROR - CAN'T VERIFY USERNAME, NO SOCKET" })
				return
			}
			socket.emit("setupUser", { name }, function({ success, error, user }) {
				if (error) {
					console.log(error)
					reject(error)
				} else if (success) {
					console.log(success)
					resolve({ success, user })
				}
			})
		})
	}

	/**
	 * @param {Room} room
	 */
	updateRoom = ({ name, password, users }) => {
		chatrooms[name] = {
			...chatrooms[name],
			...(!chatrooms[name].msgs && { msgs: [] }),
			...(!password && { password }),
			users,
		}
		const { curRoom } = this.state
		if (curRoom?.name === name) {
			this.setState({ curRoom: chatrooms[name] })
		}
	}

	/**
	 * @param {string} name
	 * @param {string} [password]
	 * @return {Promise<Object<string, Room>>}
	 */
	joinRoom = (name, password) => {
		const { socket, username, joinedRoomNames } = this.state
		return new Promise((resolve, reject) => {
			if (!socket) {
				reject({ error: "ERROR - CAN'T VERIFY USERNAME, NO SOCKET" })
				return
			}
			socket.emit("joinRoom", { username, name, password }, function({ success, error, room }) {
				if (error) {
					console.log(error)
					reject(error)
				} else if (success) {
					console.log(success)
					const alreadySavedRoom = joinedRoomNames.find((r) => r.name === name)
					if (!alreadySavedRoom) {
						this.setState({ joinedRoomNames: joinedRoomNames.concat([name]) })
					}
					this.updateRoom(room)
					resolve({ success, room })
				}
			})
		})
	}

	submitName = (e) => {
		e.preventDefault()
		const { inputUsername } = this.state
		this.setupUser(inputUsername)
			.then(({ success, user }) => {
				this.setState({ username: inputUsername, inputUsername: "" })
			})
			.catch((error) => {
				this.setState({ inputUsername: error })
			})
	}

	render() {
		return (
			<Root>
				{null ? (
					<>
						<ChatNav joinedRooms={null} joinRoom={null} />
						<Messaging />
						<UserList joinedRooms={null} focusedRoom={null} />
					</>
				) : (
					<form onSubmit={null}>
						<label>
							Enter name: <input type="text" value={null} onChange={null} minLength="1" required />
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
	theme: addTheme("chat", {
		mainColor: "#e00b89",
		altColor: "#ffb439",
		gradient: "linear-gradient(45deg, #e00b89 15%, #ffb439 95%)",
	}),
	authRequired: false,
})

export default Chat
