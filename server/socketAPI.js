const shared = require("./shared")
const queries = require("./db/queries")

module.exports = function (io) {
	var User = {
		setup: function ({ uid, uname, socketID }) {
			if (!uid || !uname) throw Error("User.create() bad params")
			var self = Object.create(this)
			self.uid = uid
			self.uname = uname
			self.socketID = socketID
			self.myRooms = []
			self.curRoomRID = null
			return self
		},
		clientCopy: function () {
			const { uid, uname, socketID, myRooms, curRoomRID } = this
			return {
				uid,
				uname,
				socketID,
				myRooms,
				curRoomRID,
			}
		},
		leaveRoom: function (rid) {
			if (this.myRooms.find((r) => r == rid)) {
				const socket = io.of("/").sockets.get(this.socketID)
				socket.leave(`${rid}`)
				this.myRooms = this.myRooms.filter((r) => r != rid)
				const room = Rooms.get(rid)
				return room ? room.removeUser(this.uid) : false
			}
		},
		joinRoom: function (rid, makeCur = true) {
			if (!rid) {
				return false
			}
			const socket = io.of("/").sockets.get(this.socketID)
			const curRoom = Rooms.get(this.curRoomRID)
			const nextRoom = Rooms.get(rid)
			if (nextRoom) {
				if (makeCur) this.curRoomRID = nextRoom.rid
				if (nextRoom.addUser(this.uid)) {
					socket.join(`${rid}`)
					this.myRooms.push(`${rid}`)
				}
				if (curRoom) socket.to(`${curRoom.rid}`).emit("updateRoom", curRoom.clientCopy())
				socket.to(`${nextRoom.rid}`).emit("updateRoom", nextRoom.clientCopy())
				return true
			}
			return false
		},
		disconnect: function () {
			const rooms = [...this.myRooms]
			rooms.forEach((rid) => this.leaveRoom(rid))
		},
	}

	var Users = {
		active: {},
		setup: function (userData) {
			if (!userData || (userData && !userData.uid)) return
			this.active[userData.uid] = User.setup(userData)
			return this.active[userData.uid]
		},
		get: function (val) {
			let output = this.active[val]
			if (!output) {
				Object.keys(this.active).find((id) => {
					const curUser = this.active[id]
					const match = Object.keys(curUser).find((key) => curUser[key] == val)
					if (match) output = curUser
					return match
				})
			}
			return output
		},
		disconnect: function (sid) {
			const user = this.get(sid)
			if (user) {
				user.disconnect()
				delete this.active[user.uid]
				return true
			}
			return false
		},
		log: function () {
			console.log("### USERS ###")
			console.log(this.active)
		},
	}

	var Room = {
		create: function ({ rid, rname, password = null }) {
			if (!rid || !rname) throw Error("Room.create() bad params")
			var self = Object.create(this)
			self.rid = rid
			self.rname = rname
			self.password = password
			self.activeUsers = []
			return self
		},
		contains: function (uid) {
			return !!this.activeUsers.find((id) => id == uid)
		},
		addUser: function (uid) {
			const user = Users.get(uid)
			if (!user || this.contains(uid)) return false
			this.activeUsers.push(uid)
			return true
		},
		removeUser: function (uid) {
			if (!this.contains(uid)) {
				return false
			}
			this.activeUsers = this.activeUsers.filter((u) => u != uid)
			if (this.activeUsers.length < 1) Rooms.destroy(this.rid)
			else io.in(`${this.rid}`).emit("updateRoom", this.clientCopy())
			return true
		},
		clientCopy: function () {
			const { rid, rname, password, activeUsers } = this
			return {
				rid,
				rname,
				password,
				activeUsers: activeUsers.reduce((acc, uid) => {
					const user = Users.get(uid)
					if (user.curRoomRID == this.rid) acc[uid] = user.clientCopy()
					return acc
				}, {}),
			}
		},
	}

	var Rooms = {
		active: {},
		create: function (roomData) {
			if (!roomData || (roomData && !roomData.rid)) throw Error("Rooms.add() bad params")
			this.active[roomData.rid] = Room.create(roomData)
			return this.active[roomData.rid]
		},
		get: function (rid) {
			return this.active[rid]
		},
		destroy: function (rid) {
			if (this.active[rid]) {
				delete this.active[rid]
				return true
			}
			return false
		},
		log: function () {
			console.log("### ROOMS ### ")
			console.log(this.active)
		},
	}

	// Precaution to trim any rooms/users that shouldn't be there due to my coding or weird network issues.
	const trimIntervalHours = 12
	setInterval(() => {
		// console.log(`socketAPI trim interval called.`)
		Object.keys(Rooms.active).forEach((rid) => {
			const room = Rooms.get(rid)
			if (room.activeUsers.length < 1) Rooms.destroy(rid)
		})
		Object.keys(Users.active).forEach((uid) => {
			const user = Users.get(uid)
			const socket = io.of("/").sockets.get(user.socketID)
			if (!socket.connected) {
				socket.disconnect(true)
				Users.disconnect(user.socketID)
			}
		})
	}, 1000 * 60 * 60 * trimIntervalHours)

	io.on("connection", function (socket) {
		socket.on("setupUser", async function (passedUser, clientCB) {
			if (!passedUser) return clientCB({ error: "server error - setupUser() - bad params" })

			// Check if user is already active.
			let user = Users.get(passedUser.uid || passedUser.uname)
			if (user) {
				if (user.socketID === socket.id) {
					return clientCB({ success: "server success - setupUser() - you're already setup", user })
				} else if (user.socketID !== socket.id) {
					return clientCB({ error: "server error - setupUser() - socket taken" })
				}
			} else {
				try {
					const dbData = await queries.chat.setup(user || passedUser)
					user = Users.setup({ ...dbData.user, socketID: socket.id })

					clientCB({
						success: "server success - setupUser()",
						data: {
							...dbData,
							user: { ...user.clientCopy() },
						},
					})
				} catch (error) {
					console.error("socket setupUser() error: ", error)
					clientCB({ error: `server error - setupUser() - ${error}` })
				}
			}
		})

		socket.on("createRoom", async function ({ uid, rname, password = null }, clientCB) {
			let user = Users.get(uid)
			// Make sure password is null or a string with at least 6 char.
			const okPass = password === null || (typeof password === "string" && password.length > 5)
			try {
				if (!user || !rname || !okPass) throw Error("bad params")
				const nextRoom = await queries.chat.createRoom({ uid, rname, password })
				const room = Rooms.create(nextRoom)
				user.joinRoom(room.rid)

				clientCB({ success: "server success - createRoom()", room: room.clientCopy() })
			} catch (error) {
				console.error("socket createRoom() error: ", error)
				clientCB({ error: `server error - createRoom() - ${error}` })
			}
		})

		socket.on("joinRoom", async function ({ uid, rid, password = null, makeCur, lastMsgTS }, clientCB) {
			let user = Users.get(uid)
			if (!rid || !user) {
				return clientCB({ error: "server error - joinRoom() - bad params" })
			}
			try {
				let room = Rooms.get(rid)
				if (!room) {
					const roomRes = await queries.chat.getRoom(rid)
					if (roomRes.rows.length < 1) {
						throw Error("room doesn't exist")
					}
					room = Rooms.create(roomRes.rows[0])
				} else if (room && user.curRoomRID == rid) {
					return clientCB({ success: "server success - joinRoom() - already in that room! :)" })
				}
				// Check for and deal with room password. For now not hashing/encrypting.
				if (room.password && room.password !== password) throw Error("invalid room password")

				await queries.chat.joinRoom({ uid, rid })
				let msgs = {}
				if (!room.contains(uid)) {
					msgs = await queries.chat.getRoomMsgs({ uid, rid, lastMsgTS })
				}

				user.joinRoom(rid, makeCur)

				clientCB({
					success: "server success - joinRoom()",
					room: {
						...room.clientCopy(),
						msgs,
					},
				})
			} catch (error) {
				console.error("socket joinRoom() error: ", error)
				clientCB({ error: `server error - joinRoom() - ${error}` })
			}
		})

		socket.on("getLogsDMS", async function ({ uid, recip_id, tsLogsFetched }, clientCB) {
			try {
				const dms = await queries.chat.getLogsDMS({ uid, recip_id, tsLogsFetched })
				clientCB({ success: "server success - getLogsDMS()", data: { dms, recip_id } })
			} catch (error) {
				console.error("socket getLogsDMS() error: ", error)
				clientCB({ error: `server error - getLogsDMS() - ${error}` })
			}
		})

		socket.on("sendDM", async function ({ uid, recip_id, msg }, clientCB) {
			const recip = Users.get(recip_id)
			try {
				let dmsRes = await queries.chat.sendDM({ uid, recip_id, msg })
				// Client's state { myDMS } keys are based on the UID of their DM partner. So I
				// need to be careful and make sure the returned data's key is their partner's UID.
				const senderDMS = shared.dataUnreadTransform(dmsRes.rows, { uid, uniqKey: "dmid" })
				const receiverDMS = shared.dataUnreadTransform(dmsRes.rows, { uid: recip_id, uniqKey: "dmid" })

				if (recip)
					socket.to(recip.socketID).emit("receiveData", { data: { dms: receiverDMS, recip_id: uid } })
				clientCB({ success: "server success - sendDM()", data: { dms: senderDMS, recip_id } })
			} catch (error) {
				console.error("socket sendDM() error: ", error)
				clientCB({ error: `server error - sendDM() - ${error}` })
			}
		})

		socket.on("deleteRoom", async function ({ uid, rid }, clientCB) {
			try {
				const user = Users.get(uid)
				if (!user || !rid) throw Error("bad params")
				if (rid == 1) throw Error("can't leave or delete room 'General'")

				await queries.chat.deleteRoom({ uid, rid })
				user.leaveRoom(rid)

				clientCB({ success: "server success - deleteRoom()" })
			} catch (error) {
				console.error("socket deleteRoom() error: ", error)
				clientCB({ error: `server error - deleteRoom() - ${error}` })
			}
		})

		socket.on("sendRoomMsg", async function ({ uid, rid, msg }, clientCB) {
			try {
				const insertMsgRes = await queries.chat.sendRoomMsg({ uid, rid, msg })

				const emittedMsgs = shared.dataUnreadTransform(insertMsgRes.rows, { uniqKey: "mid" })
				socket
					.to(`${rid}`)
					.emit("receiveData", { data: { ...Rooms.get(rid).clientCopy(), msgs: emittedMsgs } })

				const cbMsgs = shared.dataUnreadTransform(insertMsgRes.rows, { uid, uniqKey: "mid" })
				clientCB({ success: "server success - sendMsg()", msgs: cbMsgs })
			} catch (error) {
				console.error("socket sendRoomMsg() error: ", error)
				clientCB({ error: `server error - sendMsg() - ${error}` })
			}
		})

		socket.on("log", function () {
			Rooms.log()
			Users.log()
		})

		socket.on("disconnecting", function () {
			Users.disconnect(socket.id)
		})
	})
}
