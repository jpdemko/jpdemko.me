import { Component, createRef } from "react"
import styled from "styled-components/macro"
import socketIOClient from "socket.io-client"
import mergeWith from "lodash/mergeWith"
import { DateTime } from "luxon"

import { setupAppSharedOptions, themes, Contexts, ls, Debug } from "../../shared/shared"
import { ReactComponent as SvgChat } from "../../shared/assets/material-icons/chat.svg"
import ChatNav from "./ChatNav"
import Logs from "./Logs"
import ChatInput from "./ChatInput"
import ChatInfo from "./ChatInfo"
import Button from "../ui/Button"

/* --------------------------------- STYLES --------------------------------- */

const Root = styled.div`
	--chat-padding: 0.4em;
	display: flex;
`

const Main = styled.div`
	flex: 1 1;
	display: flex;
	flex-direction: column;
`

/* -------------------------------- COMPONENT ------------------------------- */

const debug = new Debug("<Chat />", true)

class Chat extends Component {
	constructor(props) {
		super(props)
		const prevData = this.getUserData()

		const isProd = process.env.NODE_ENV === "production"
		this.state = {
			curRoomRID: 1,
			curDMUID: null,
			myRooms: null,
			myDMS: null,
			initUsername: "",
			roomsShown: true,
			...prevData,
			finSetup: false,
			socket: socketIOClient(isProd ? "https://www.jpdemko.me" : "http://localhost:5000", {
				credentials: "include",
				withCredentials: true,
				reconnectionDelay: 1000,
				reconnection: true,
				reconnectionAttempts: 20,
				transports: ["websocket"],
				agent: false,
				upgrade: false,
				...(isProd && { rejectUnauthorized: false }),
			}),
		}
		this.tsChatOpened = DateTime.local()
		this.initUsernameRef = createRef()
		this.intervalHandleUnread = null
	}

	componentDidMount() {
		const { socket } = this.state
		const { user } = this.props

		// Setup socket event listeners.
		socket.on("updateRoom", this.updateRoom)
		socket.on("receiveData", this.receiveData)
		socket.on("reconnect", this.loadUser)
		socket.on("connect_error", (err) => {
			console.error("socket connect_error due to: ", err)
		})
		// Setup data save on exit.
		window.addEventListener("beforeunload", this.saveUserData)
		// Attempt to load prev. save data if any.
		this.loadUser()
		// Auto focus username input field if available.
		if (!user && this.initUsernameRef.current) this.initUsernameRef.current.focus({ preventScroll: true })
		// Setup interval to mark messages as read for current room/DM.
		this.msTimeCheckUnread = 1000 * 30
		this.intervalHandleUnread = setInterval(this.handleUnread, this.msTimeCheckUnread)
	}

	componentDidUpdate(prevProps, prevState) {
		const activityChange = prevProps.appActive !== this.props.appActive
		const viewChange = prevState.roomsShown !== this.state.roomsShown
		const roomChange = prevState.curRoomRID != this.state.curRoomRID
		const convoChange = prevState.curDMUID != this.state.curDMUID

		if (activityChange || viewChange || roomChange || convoChange) {
			// Reset unread handler interval when certain things occur.
			clearInterval(this.intervalHandleUnread)
			this.intervalHandleUnread = setInterval(this.handleUnread, this.msTimeCheckUnread)
			// Prune temp DM convo rooms where no DMS were exchanged.
			this.pruneTempDMS()
		}
		// After init. fast/trimmed user setup 'finSetup' flag will be set so we can load the rest of their data.
		if (!prevState.finSetup && this.state.finSetup) this.bgSetup()
	}

	componentWillUnmount() {
		const { socket } = this.state
		// All of these are precautions if they fail to occur in other places.
		if (socket) socket.disconnect()
		this.saveUserData()
		// Remove events & unread handler interval.
		window.removeEventListener("beforeunload", this.saveUserData)
		clearInterval(this.intervalHandleUnread)
	}

	saveUserData = () => {
		if (!this.props.user || !this.state.myRooms) return

		const { socket, ...otherState } = this.state
		let prevData = ls.get(this.props.title) ?? {}
		ls.set("Chat", { ...prevData, ...otherState })
	}

	getUserData = () => {
		return ls.get(this.props.title) ?? {}
	}

	loadUser = async () => {
		const { curRoomRID } = this.state
		if (!this.props.user) return

		this.context.setAppLoading(true)
		let setupRes = null
		try {
			setupRes = await this.socketSetupUser()
		} catch (error) {
			console.error("<Chat /> loadUser() socketSetupUser() error: ", error)
		}
		if (setupRes) {
			const {
				data: { myRooms, roomsShown, curDMUID },
			} = setupRes
			// Set data and then fast load the user's current room or DM (based on roomsShown).
			this.setState(setupRes.data, async () => {
				try {
					if (roomsShown && myRooms) await this.joinRoom({ room: myRooms[curRoomRID] })
					else if (!roomsShown && curDMUID) await this.openDM(curDMUID)
				} catch (error) {
					console.error("<Chat /> loadUser() join current room or DM error: ", error)
				}
				this.context.setAppLoading(false)
			})
		} else this.context.setAppLoading(false)
	}

	bgSetup = () => {
		const { myRooms, curRoomRID } = this.state
		const roomsProm = Object.keys(myRooms)
			.filter((rid) => rid != curRoomRID)
			.map((rid) => this.socketJoinRoom({ room: myRooms[rid] }))
		Promise.all(roomsProm)
			.then(() => debug.log("bgSetup() finished", { ...this.state }))
			.catch(console.error)
	}

	socketSetupUser = () => {
		const { socket, myDMS, myRooms, curRoomRID, curDMUID, roomsShown } = this.state
		let { user } = this.props

		return new Promise((resolve, reject) => {
			if (!socket || !user) return reject("<Chat /> socketSetupUser() error: bad params")
			socket.emit("setupUser", { user, curRoomRID }, ({ success, error, data }) => {
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
					data.finSetup = true
					resolve({ success, data })
				}
			})
		})
	}

	handleUnread = (data) => {
		const { curRoomRID, myRooms, myDMS, curDMUID, roomsShown } = this.state
		const { appActive } = this.props

		function makeUnread(d) {
			const isRoom = !!d?.msgs
			const logs = d?.dms ?? d?.msgs
			const ulID = d?.users_last

			const activeInRoom = appActive && roomsShown && isRoom && curRoomRID == d?.rid
			const activeInDMS = appActive && !roomsShown && !isRoom && curDMUID == d?.recip_id
			let totalUnread = 0
			if (logs) {
				Object.keys(logs).forEach((id) => {
					const cur = logs[id]
					if (isNaN(cur) && (id < ulID || activeInRoom || activeInDMS)) cur.unread = false
					if (cur?.unread) totalUnread++
				})
				logs.totalUnread = totalUnread
			}
		}

		if (data) return makeUnread(data)
		else {
			const nextRooms = { ...myRooms }
			Object.keys(nextRooms).forEach((key) => makeUnread(nextRooms[key]))
			const nextDMS = { ...myDMS }
			Object.keys(nextDMS).forEach((key) => makeUnread(nextDMS[key]))
			this.setState({ myRooms: nextRooms, myDMS: nextDMS })
		}
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

	updateRoom = (params = {}) => {
		const { serverUser = {}, data = {}, makeCur = false } = params
		if (!data?.rid && !serverUser?.curRoomRID) return
		// serverMyRooms: { rid: { activeUsers } }
		const { myRooms: serverMyRooms, curRoomRID } = serverUser

		// Want to always override client data with data from server if provided.
		const myRooms = { ...(this.state.myRooms ?? {}) }
		if (serverMyRooms) {
			mergeWith(myRooms, serverMyRooms, (val, src, key) => {
				if (key === "activeUsers" && src) return src
			})
		}

		const { rid, msgs, roomDeleted } = data

		if (msgs) {
			const lastMID = Object.keys(msgs)
				.filter((mid) => !isNaN(mid))
				.pop()
			const lastMsg = msgs[lastMID] ?? {}
			if (lastMsg?.uid == this.props.user.uid) data.users_last = lastMID
		}

		if (rid) {
			myRooms[rid] = {
				...(myRooms?.[rid] ?? {}),
				...data,
				msgs: {
					...(myRooms?.[rid]?.msgs ?? {}),
					...(msgs ?? {}),
				},
			}
			this.handleUnread(myRooms[rid])
		}

		// If a user is chatting on multiple devices on the same account and deletes a room, the server
		// will emit a socket event and trigger this callback to sync all of them here.
		let delKeys = []
		if (roomDeleted && serverMyRooms) {
			const serverRIDs = Object.keys(serverMyRooms)
			delKeys = Object.keys(myRooms).filter((rid) => {
				return serverRIDs.indexOf(rid) < 0
			})
			delKeys.forEach((key) => delete myRooms[key])
		}

		this.setState(
			{
				myRooms: myRooms,
				...((curRoomRID || makeCur) && { curRoomRID: curRoomRID ?? rid }),
			},
			() => {
				if (delKeys.length > 0 && curRoomRID)
					this.joinRoom({ room: myRooms[curRoomRID] }).catch(console.error)
			}
		)
	}

	socketJoinRoom = ({ room, makeCur }) => {
		const { socket, myRooms, curRoomRID } = this.state
		const { user } = this.props

		room = myRooms?.[room?.rid] ?? room
		const { rid, password, msgs } = room

		return new Promise((resolve, reject) => {
			if (!socket || !user || !rid) return reject("<Chat /> socketJoinRoom() error: bad params")
			const ioVars = {
				uid: user.uid,
				rid,
				password,
				makeCur: makeCur ?? curRoomRID == room.rid,
			}
			if (msgs) ioVars.lastMsgTS = this.getLastTimestamp(msgs)
			socket.emit("joinRoom", ioVars, ({ success, error }) => {
				if (error) reject(error)
				else if (success) resolve({ success })
			})
		})
	}

	joinRoom = ({ room }) => {
		this.setState({ roomsShown: true })
		return this.socketJoinRoom({ room, makeCur: true }).then(() => {
			this.context.setAppDrawerShown(false)
		})
	}

	deleteRoom = (selectedRID) => {
		const { curRoomRID, socket, myRooms } = this.state
		const { user } = this.props

		new Promise((resolve, reject) => {
			if (selectedRID == 1) return reject("can't delete default room 'General'.")
			else
				socket.emit("deleteRoom", { uid: user.uid, rid: selectedRID }, ({ success, error }) => {
					if (error) reject(error)
					else if (success) resolve({ success })
				})
		})
			.then(() => {
				if (curRoomRID == selectedRID) {
					return this.joinRoom({ room: myRooms[1] }).then(() => {
						let nextRooms = { ...myRooms }
						delete nextRooms[selectedRID]
						this.setState({ myRooms: nextRooms })
					})
				}
			})
			.catch((error) => console.error("<Chat /> deleteRoom() error: ", error))
	}

	socketCreateRoom = (room) => {
		const { socket } = this.state
		const { user } = this.props

		const { rname, password } = room
		const ioVars = {
			uid: user.uid,
			rname,
			password,
		}
		return new Promise((resolve, reject) => {
			socket.emit("createRoom", ioVars, ({ error, success }) => {
				if (error) reject(error)
				else if (success) resolve({ success })
			})
		})
	}

	createRoom = (room) => {
		return this.socketCreateRoom(room).then(({ success }) => {
			if (success) this.context.setAppDrawerShown(false)
		})
	}

	socketSendRoomMsg = (msg) => {
		const { socket, curRoomRID } = this.state
		const { user } = this.props

		return new Promise((resolve, reject) => {
			socket.emit("sendRoomMsg", { msg, rid: curRoomRID, uid: user.uid }, ({ error, success }) => {
				if (success) resolve({ success })
				else reject(error)
			})
		})
	}

	openDM = async (passedUser) => {
		const { myDMS } = this.state
		const { user } = this.props
		const { uid: recip_id, uname: recip_uname } = passedUser
		if (!recip_id) return
		else if (recip_id == user?.uid) return

		this.setState({
			roomsShown: false,
			curDMUID: recip_id,
		})

		if (myDMS[recip_id]) {
			try {
				const dmsRes = await this.socketGetLogsDMS({ recip_id, user })
				if (dmsRes?.success) this.updateDM(dmsRes.data)
			} catch (error) {
				console.error(error)
			}
		} else {
			let nextDMS = { ...myDMS }
			nextDMS[recip_id] = {
				temp: true,
				recip_uname,
				dms: {},
			}
			this.setState({ myDMS: nextDMS })
		}
		this.context.setAppDrawerShown(false)
	}

	socketGetLogsDMS = ({ recip_id, user: passedUser }) => {
		const { socket, myDMS } = this.state
		let { user } = this.props
		if (passedUser) user = passedUser

		return new Promise((resolve, reject) => {
			if (!recip_id && !user?.uid) return reject("<Chat /> socketGetLogsDMS() error: bad params")
			// To prevent redundant calls to the DB. I could set this up for rooms as well, but
			// rooms are kept track of on the server actively. DMS are not, so there is no way to know on the
			// server if the user doesn't need logs or not.
			const convo = myDMS?.[recip_id]
			if (convo?.tsLogsFetched) {
				const dtFetched = DateTime.fromISO(convo.tsLogsFetched).toLocal()
				if (this.tsChatOpened < dtFetched)
					return reject("<Chat /> socketGetLogsDMS() skipped, already gathered DMS!")
			}
			const ioVars = {
				uid: user.uid,
				recip_id,
				tsLogsFetched: convo?.tsLogsFetched,
			}
			socket.emit("getLogsDMS", ioVars, ({ success, error, data }) => {
				if (error) reject(error)
				else if (success) {
					data.dms = { ...(convo?.dms ?? {}), ...(data?.dms ?? {}) }
					data.tsLogsFetched = DateTime.local().toISO()
					resolve({ success, data })
				}
			})
		})
	}

	socketSendDM = (text) => {
		const { socket, curDMUID } = this.state
		const { user } = this.props

		return new Promise((resolve, reject) => {
			if (!user?.uid || !curDMUID || !text) return reject("<Chat /> socketSendDM() error: bad params")
			const ioVars = { uid: user.uid, recip_id: curDMUID, msg: text, uname: user.uname }
			socket.emit("sendDM", ioVars, ({ success, error }) => {
				if (error) reject(error)
				else if (success) resolve({ success })
			})
		})
	}

	updateDM = ({ data = {} }) => {
		// data { recip_id, dms: { dmid#: { ...dmData } } }
		const { recip_id, dms } = data
		if (!dms || !recip_id) return

		const lastDMID = Object.keys(dms)
			.filter((dmid) => !isNaN(dmid))
			.pop()
		const lastDM = dms[lastDMID] ?? {}
		if (lastDM?.uid == this.props.user.uid) data.users_last = lastDMID

		let nextMyDMS = { ...this.state.myDMS }
		nextMyDMS[recip_id] = {
			...(nextMyDMS[recip_id] ?? {}),
			...data,
			dms: {
				...(nextMyDMS[recip_id]?.dms ?? {}),
				...(dms ?? {}),
			},
		}
		this.handleUnread(nextMyDMS[recip_id])

		if (nextMyDMS[recip_id]?.temp) nextMyDMS[recip_id].temp = false

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

	receiveData = (res) => {
		// Each updater will pass their updated room/convo to this.handleUnread
		if (res?.serverUser?.access === "banned") return this.props?.resetAuth?.()
		else if (res?.data?.msgs) this.updateRoom(res)
		else if (res?.data?.dms) this.updateDM(res)
	}

	send = (data) => {
		if (!data) return Promise.reject("<Chat /> send() error: bad params")

		const { inputSent, roomsShown } = this.state
		const fn = roomsShown ? this.socketSendRoomMsg : this.socketSendDM
		return fn(data).then((res) => {
			if (res) this.setState({ inputSent: !inputSent })
		})
	}

	log = (e) => {
		e.preventDefault()
		const { socket } = this.state
		if (socket) socket.emit("log")
	}

	ban = (user2ban = {}) => {
		const { socket } = this.state
		const { uid, pid } = user2ban

		return new Promise((resolve, reject) => {
			if (!uid || !pid) return reject("<Chat /> ban() error: bad params")
			else if (uid === this.props?.user?.uid) return reject("<Chat /> ban() error: don't ban yourself!")
			socket.emit("ban", user2ban, ({ success, error }) => {
				if (error) reject(error)
				else if (success) resolve({ success })
			})
		})
	}

	render() {
		const { curRoomRID, curDMUID, myRooms, myDMS, roomsShown, inputSent } = this.state
		const { user } = this.props

		let data = null
		if (!roomsShown && curDMUID) data = myDMS[curDMUID]
		else if (roomsShown && myRooms) data = myRooms[curRoomRID]

		return (
			<Root>
				{process.env.NODE_ENV !== "production" && (
					<div style={{ position: "absolute", left: "35%", top: "1%" }}>
						<Button onClick={this.log} variant="fancy">
							SERVER LOG
						</Button>
					</div>
				)}
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
					ban={this.ban}
				/>
				<Main>
					<ChatInfo data={data} roomsShown={roomsShown} />
					<Logs
						data={data}
						user={user}
						openDM={this.openDM}
						roomsShown={roomsShown}
						inputSent={inputSent}
						ban={this.ban}
					/>
					<ChatInput send={this.send} data={data} roomsShown={roomsShown} />
				</Main>
			</Root>
		)
	}
}

Chat.contextType = Contexts.Window
Chat.shared = setupAppSharedOptions({
	title: "Chat",
	logo: SvgChat,
	theme: themes.red,
	authRequired: true,
	authReasoning:
		"To showcase user authentication as well as chat logs being persisted onto a PostreSQL database so user's won't lose their data.",
})

export default Chat
