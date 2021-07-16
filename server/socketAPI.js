const shared = require("./shared")
const queries = require("./db/queries")
const debug = require("debug")("server:socketapi")

module.exports = function (io) {
	var User = {
		setup: function ({ uid, pid, uname, curRoomRID, access }) {
			if (!uid || !pid || !uname || !curRoomRID || !access) throw Error("User.setup() bad params")
			const self = Object.create(this)
			self.uid = uid
			self.pid = pid
			self.uname = uname
			self.sockets = []
			self.myRooms = []
			self.curRoomRID = curRoomRID
			self.access = access
			return self
		},
		copyShareable: function () {
			const { uid, uname, pid } = this
			return { uid, uname, pid }
		},
		copyDetailed: function () {
			const { myRooms, curRoomRID, access } = this
			return {
				...this.copyShareable(),
				access,
				curRoomRID,
				myRooms: myRooms.reduce((acc, cur) => {
					acc[cur] = Rooms.get(cur).copyShareable()
					return acc
				}, {}),
			}
		},
		addDevice: function (sid) {
			this.sockets.push(sid)
			const socket = io.of("/").sockets.get(sid)
			socket.join(`${this.pid}`)
		},
		syncDevices: function (event, data = {}) {
			io.in(`${this.pid}`).emit(event, {
				data,
				serverUser: this.copyDetailed(),
			})
		},
		leaveRoom: function (rid) {
			const room = Rooms.get(rid)
			if (room && room.contains(this.uid)) {
				this.sockets.forEach((sid) => {
					const socket = io.of("/").sockets.get(sid)
					socket.leave(`${rid}`)
				})
				this.myRooms = this.myRooms.filter((r) => r != rid)
				if (this.curRoomRID == rid) this.curRoomRID = 1
				return room.removeUser(this.uid)
			}
			return false
		},
		joinRoom: function ({ rid, makeCur = true, sid }) {
			if (!rid || !sid) throw Error("User.joinRoom() bad params")
			const curRoom = Rooms.get(this.curRoomRID)
			const nextRoom = Rooms.get(rid)
			if (nextRoom) {
				if (makeCur) this.curRoomRID = nextRoom.rid
				if (nextRoom.addUser({ uid: this.uid, sid })) {
					this.sockets.forEach((s) => {
						const socket = io.of("/").sockets.get(s)
						socket.join(`${rid}`)
					})
					if (!this.myRooms.some((r) => r == rid)) this.myRooms.push(`${rid}`)
				}
				if (curRoom) io.in(`${curRoom.rid}`).emit("updateRoom", { data: curRoom.copyShareable() })
				return true
			}
			return false
		},
		disconnect: function (sid) {
			if (this.sockets.length === 1) {
				const rooms = [...this.myRooms]
				rooms.forEach((rid) => this.leaveRoom(rid))
			}
			this.sockets = this.sockets.filter((s) => s != sid)
		},
	}

	var Users = {
		active: {},
		setup: function (userData) {
			const newUser = User.setup(userData)
			newUser.addDevice(userData.sid)
			this.active[userData.uid] = newUser
			return this.active[userData.uid]
		},
		get: function (uid) {
			return this.active[uid]
		},
		getBySID: function (sid) {
			const id = Object.keys(this.active).find((uid) => this.active[uid].sockets.some((s) => s == sid))
			return this.active[id]
		},
		disconnect: function (sid) {
			const user = this.getBySID(sid)
			if (user) {
				user.disconnect(sid)
				if (user.sockets.length < 1) delete this.active[user.uid]
			}
		},
		ban: function (uid) {
			const user = this.get(uid)
			if (user) {
				;[...user.sockets].forEach((sid) => {
					const socket = io.of("/").sockets.get(sid)
					if (socket.request && socket.request.session) {
						socket.request.session.destroy()
					}
					user.disconnect(sid)
				})
				if (user.sockets.length < 1) delete this.active[user.uid]
			}
		},
		log: function () {
			debug("### USERS ###")
			debug(this.active)
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
			return this.activeUsers.some((id) => id == uid)
		},
		addUser: function ({ uid, sid }) {
			const user = Users.get(uid)
			if (!user) return false
			if (!this.contains(uid)) this.activeUsers.push(uid)
			const socket = io.of("/").sockets.get(sid)
			socket.to(`${this.rid}`).emit("updateRoom", { data: this.copyShareable() })
			return true
		},
		removeUser: function (uid) {
			if (!this.contains(uid)) {
				return false
			}
			this.activeUsers = this.activeUsers.filter((u) => u != uid)
			if (this.activeUsers.length < 1) Rooms.destroy(this.rid)
			else io.in(`${this.rid}`).emit("updateRoom", { data: this.copyShareable() })
			return true
		},
		copyShareable: function () {
			const { rid, rname, password, activeUsers } = this
			return {
				rid,
				rname,
				password,
				activeUsers: activeUsers.reduce((acc, uid) => {
					const user = Users.get(uid)
					if (user.curRoomRID == this.rid) acc[uid] = user.copyShareable()
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
			debug("### ROOMS ### ")
			debug(this.active)
		},
	}

	io.use((socket, next) => {
		const { request } = socket
		try {
			if (request.isAuthenticated() && request.user.access !== "banned") {
				return next()
			} else {
				next(new Error("You are banned!"))
			}
		} catch (error) {
			debug("io.use() MW error: ", error)
			next(new Error(error))
		}
	})

	io.on("connection", function (socket) {
		socket.on("setupUser", async function ({ user: passedUser, curRoomRID }, clientCB) {
			if (!passedUser) return clientCB({ error: "server error - socket setupUser() - bad params" })

			// Check if user is already active.
			let user = Users.get(passedUser.uid)
			if (user) {
				if (user.sockets.some((sid) => sid == socket.id)) {
					return clientCB({
						success: "server success - socket setupUser() - you're already connected from that socket",
					})
				} else user.addDevice(socket.id)
			}
			try {
				const dbData = await queries.chat.setup(user || passedUser)
				if (!user) user = Users.setup({ ...dbData.user, sid: socket.id, curRoomRID })

				debug(`socket#${socket.id} setupUser(${user.uid}) "${user.uname}"`)
				clientCB({
					success: "server success - socket setupUser()",
					data: {
						...dbData,
						user: user.copyDetailed(),
					},
				})
			} catch (error) {
				debug("socket setupUser() error: ", error)
				clientCB({ error: `server error - socket setupUser() - ${error}` })
			}
		})

		socket.on("createRoom", async function ({ uid, rname, password = null }, clientCB) {
			try {
				let user = Users.get(uid)
				// Make sure password is null or a string with at least 6 char.
				const okPass = password === null || (typeof password === "string" && password.length > 5)
				if (!user || !rname || !okPass) throw Error("bad params")

				const nextRoom = await queries.chat.createRoom({ uid, rname, password })
				const room = Rooms.create(nextRoom)
				user.joinRoom({ rid: room.rid, sid: socket.id, makeCur: true })
				user.syncDevices("updateRoom", room.copyShareable())
				clientCB({ success: "server success - socket createRoom()" })
			} catch (error) {
				debug("socket createRoom() error: ", error)
				clientCB({ error: `server error - socket createRoom() - ${error}` })
			}
		})

		socket.on("joinRoom", async function ({ uid, rid, password = null, makeCur, lastMsgTS }, clientCB) {
			try {
				let user = Users.get(uid)
				if (!rid || !user) throw Error("bad params")

				let room = Rooms.get(rid)
				if (!room) {
					const roomRes = await queries.chat.getRoom(rid)
					if (roomRes.rows.length < 1) {
						throw Error("room doesn't exist")
					}
					room = Rooms.create(roomRes.rows[0])
				} else if (room && user.curRoomRID == rid && socket.rooms.has(`${rid}`)) {
					return clientCB({
						success: "server success - socket joinRoom() - you're already in that room!",
					})
				}
				// Check for and deal with room password. For now not hashing/encrypting.
				if (room.password && room.password !== password) throw Error("invalid room password")

				await queries.chat.joinRoom({ uid, rid })
				let msgs = {}
				if (!socket.rooms.has(`${rid}`)) {
					msgs = await queries.chat.getRoomMsgs({ uid, rid, lastMsgTS })
				}

				user.joinRoom({ rid, makeCur, sid: socket.id })
				user.syncDevices("updateRoom", {
					...room.copyShareable(),
					msgs,
				})
				clientCB({ success: "server success - socket joinRoom()" })
			} catch (error) {
				debug("socket joinRoom() error: ", error)
				clientCB({ error: `server error - socket joinRoom() - ${error}` })
			}
		})

		socket.on("deleteRoom", async function ({ uid, rid }, clientCB) {
			try {
				const user = Users.get(uid)
				if (!user || !rid) throw Error("bad params")
				else if (rid == 1) throw Error("can't leave or delete room 'General'")

				await queries.chat.deleteRoom({ uid, rid })
				user.leaveRoom(rid)
				user.syncDevices("updateRoom", { roomDeleted: true })
				clientCB({ success: "server success - socket deleteRoom()" })
			} catch (error) {
				debug("socket deleteRoom() error: ", error)
				clientCB({ error: `server error - socket deleteRoom() - ${error}` })
			}
		})

		socket.on("getLogsDMS", async function ({ uid, recip_id, tsLogsFetched }, clientCB) {
			try {
				const dms = await queries.chat.getLogsDMS({ uid, recip_id, tsLogsFetched })
				clientCB({ success: "server success - socket getLogsDMS()", data: { dms, recip_id } })
			} catch (error) {
				debug("socket getLogsDMS() error: ", error)
				clientCB({ error: `server error - socket getLogsDMS() - ${error}` })
			}
		})

		socket.on("sendDM", async function ({ uid, uname, recip_id, msg }, clientCB) {
			const sender = Users.get(uid)
			const recip = Users.get(recip_id)
			try {
				let dmsRes = await queries.chat.sendDM({ uid, recip_id, msg })
				// Client's state { myDMS } keys are based on the UID of their DM partner. So I
				// need to be careful and make sure the returned data's key is their partner's UID.
				const senderDMS = shared.dataUnreadTransform(dmsRes.rows, { uid, uniqKey: "dmid" })
				const receiverDMS = shared.dataUnreadTransform(dmsRes.rows, { uid: recip_id, uniqKey: "dmid" })

				if (recip) {
					socket
						.to(recip.pid)
						.emit("receiveData", { data: { dms: receiverDMS, recip_id: uid, recip_uname: uname } })
				}
				sender.syncDevices("receiveData", { dms: senderDMS, recip_id, recip_uname: uname })
				clientCB({ success: "server success - socket sendDM()" })
			} catch (error) {
				debug("socket sendDM() error: ", error)
				clientCB({ error: `server error - socket sendDM() - ${error}` })
			}
		})

		socket.on("sendRoomMsg", async function ({ uid, rid, msg }, clientCB) {
			try {
				const room = Rooms.get(rid)
				if (!room) throw Error("Room was not created on the server for some reason, please refresh.")

				const insertMsgRes = await queries.chat.sendRoomMsg({ uid, rid, msg })
				const emittedMsgs = shared.dataUnreadTransform(insertMsgRes.rows, { uniqKey: "mid" })
				io.in(`${rid}`).emit("receiveData", {
					data: { ...room.copyShareable(), msgs: emittedMsgs },
				})

				clientCB({ success: "server success - socket sendRoomMsg()" })
			} catch (error) {
				debug("socket sendRoomMsg() error: ", error)
				clientCB({ error: `server error - socket sendRoomMsg() - ${error}` })
			}
		})

		socket.on("log", function () {
			Rooms.log()
			Users.log()
		})

		socket.on("ban", async function ({ uid, pid }, clientCB) {
			try {
				if (socket.user && socket.user.access !== "admin") throw Error("You are not an admin!")
				const bannedUserRes = await queries.users.ban(pid)
				const serverBannedUser = Users.get(uid)
				if (serverBannedUser) {
					serverBannedUser.access = "banned"
					serverBannedUser.syncDevices("receiveData")
					Users.ban(uid)
				}
				// Go ahead and kick user above, but double check if the user returned from DB res has been marked 'banned'.
				if (bannedUserRes.rows.length > 0) {
					const dbBannedUser = bannedUserRes.rows[0]
					if (dbBannedUser && dbBannedUser.access != "banned")
						throw Error(`user returned from queries.users.ban(${pid}) should be banned, but wasn't...`)
				} else throw Error(`queries.users.ban(${pid}) should have returned a user but didn't...`)

				clientCB({ success: "server success - socket ban()" })
			} catch (error) {
				debug("socket ban() error: ", error)
				clientCB({ error: `server error - socket ban() - ${error}` })
			}
		})

		socket.on("disconnecting", function () {
			Users.disconnect(socket.id)
		})
	})
}
