function row2obj(row, keyName) {
	return row.reduce((acc, ele) => {
		if (!keyName) keyName = Object.keys(ele).find((key) => key.includes("id"))
		acc[ele[keyName]] = ele
		return acc
	}, {})
}

module.exports = function (io, sessionMiddleware, db) {
	var User = {
		setup: function ({ uid, uname, socketID }) {
			if (!uid || !uname) throw Error("User.create() bad params")
			var self = Object.create(this)
			self.uid = uid
			self.uname = uname
			self.socketID = socketID
			self.myRooms = []
			return self
		},
		clientCopy: function () {
			const { uid, uname, socketID, myRooms } = this
			return {
				uid,
				uname,
				socketID,
				myRooms,
			}
		},
		leaveRoom: function (rid) {
			if (this.myRooms.find((r) => r === rid)) {
				const socket = io.of("/").connected[this.socketID]
				socket.leave(`${rid}`)
				this.myRooms = this.myRooms.filter((r) => `${r}` !== `${rid}`)
				const room = Rooms.get(rid)
				return room ? room.removeUser(this.uid) : false
			}
		},
		joinRoom: function (rid) {
			if (!rid) {
				console.log(`error - bad joinRoom param: ${rid}`)
				return false
			}
			const room = Rooms.get(rid)
			if (room && room.addUser(this.uid)) {
				const socket = io.of("/").connected[this.socketID]
				socket.join(`${rid}`)
				this.myRooms.push(`${rid}`)
				this.log(`joined ${room.rname}#${rid}`)
				return true
			}
			return false
		},
		disconnect: function () {
			const rooms = [...this.myRooms]
			rooms.forEach((rid) => this.leaveRoom(rid))
		},
		log: function (msg) {
			console.log(`${this.uname}#${this.uid}: ${msg}`)
		},
	}

	var Users = {
		active: {},
		setup: function (userData) {
			if (!userData || (userData && !userData.uid)) throw Error("Users.add() bad params")
			this.active[userData.uid] = User.setup(userData)
			return this.active[userData.uid]
		},
		get: function (val) {
			let output = this.active[val]
			if (!output) {
				Object.keys(this.active).find((id) => {
					const curUser = this.active[id]
					const match = Object.keys(curUser).find((key) => curUser[key] === val)
					if (match) output = curUser
					return match
				})
			}
			return output
		},
		disconnect: function (sid) {
			const user = this.get(sid)
			if (user) {
				user.log("disconnecting --> leaving all rooms")
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
		create: function ({ rid, rname, password = null, activeUsers = [] }) {
			if (!rid || !rname) throw Error("Room.create() bad params")
			var self = Object.create(this)
			self.rid = rid
			self.rname = rname
			self.password = password
			self.activeUsers = activeUsers
			self.log(`>>> CREATED`)
			return self
		},
		contains: function (uid) {
			return !!this.activeUsers.find((id) => id === uid)
		},
		addUser: function (uid) {
			if (this.contains(uid)) {
				this.log(`addUser(${uid}) error`)
				return false
			}
			this.activeUsers.push(uid)
			io.in(`${this.rid}`).emit("updateRoom", this.clientCopy())
			this.log(`added user#${uid}`)
			return true
		},
		removeUser: function (uid) {
			if (!this.contains(uid)) {
				this.log(`removeUser(${uid}) error`)
				return false
			}
			this.activeUsers = this.activeUsers.filter((u) => u !== uid)
			this.log(`removed user#${uid}`)
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
					acc[uid] = Users.get(uid).clientCopy()
					return acc
				}, {}),
			}
		},
		log: function (msg) {
			console.log(`${this.rname}#${this.rid}: ${msg}`)
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

	io.use(function (socket, next) {
		sessionMiddleware(socket.request, {}, next)
	})

	io.on("connection", function (socket) {
		console.log(`socket#${socket.id} connected`)

		socket.on("setupUser", async function ({ uid, uname }, clientCB) {
			if (!uname && !uid) return clientCB({ error: "server error - setupUser() - bad params" })

			// Check if user is already active.
			let user = Users.get(uid || uname)
			if (user) {
				if (user.socketID === socket.id)
					return clientCB({ success: "server success - setupUser() - you're already setup", user })
				else if (user.socketID !== socket.id)
					return clientCB({ error: "server error - setupUser() - username taken" })
			} else {
				try {
					const insertUserSQL = `INSERT INTO users(uname) VALUES ($1) ON CONFLICT (uname)
						DO UPDATE SET uname = EXCLUDED.uname RETURNING uid, uname`
					const userRes = await db.query(insertUserSQL, [uname])
					// Grab all the rooms the user is currently in.
					const getmyRoomsSQL = `SELECT r.rid, r.rname, r.password FROM rooms r
						INNER JOIN users_rooms ur ON r.rid = ur.rid WHERE ur.uid = $1`
					const usersRoomsRes = await db.query(getmyRoomsSQL, [userRes.rows[0].uid])
					// Grab all user's ongoing DMs and the last msg sent between them.
					const getAllDMsSQL = `
						WITH chats AS (SELECT * FROM dms_history h WHERE h.user1 = $1 OR h.user2 = $1)
						SELECT
							chats2.user1 as recip_id,
							u.uname as recip_uname,
							chats2.last_dm as dmid,
							dms.msg,
							dms.created_at
						FROM (
							SELECT chats.user1, chats.last_dm FROM chats
							UNION
							SELECT chats.user2, chats.last_dm FROM chats
						) AS chats2
						INNER JOIN users u ON chats2.user1 = u.uid
						INNER JOIN dms ON chats2.last_dm = dms.dmid
						WHERE chats2.user1 != $1 ORDER BY dms.created_at DESC`
					const usersDMsRes = await db.query(getAllDMsSQL, [userRes.rows[0].uid])

					user = Users.setup({ ...userRes.rows[0], socketID: socket.id })

					clientCB({
						success: "server success - setupUser()",
						data: {
							user: { ...user.clientCopy() },
							myRooms: row2obj(usersRoomsRes.rows, "rid"),
							myDMs: row2obj(usersDMsRes.rows, "dmid"),
						},
					})
				} catch (error) {
					error = `server error - setupUser() - ${error}`
					console.log(error)
					return clientCB({ error })
				}
			}
		})

		socket.on("createRoom", async function ({ uid, rname, password = null }, clientCB) {
			let user = Users.get(uid)
			// Make sure password is null or a string with at least 6 char.
			const okPass = password === null || (typeof password === "string" && password.length > 5)
			try {
				if (!user || !rname || !okPass) throw Error("bad params")
				// Create room in DB and return room info (rid#, rname, password?) locally.
				const createRoomSQL = `INSERT INTO rooms(rname, password) VALUES ($1, $2)
					RETURNING rid, rname, password`
				const createRoomRes = await db.query(createRoomSQL, [rname, password])
				const nextRoom = createRoomRes.rows[0]
				const rid = nextRoom.rid
				// Add user and room to users_rooms table.
				const joinRoomSQL = `INSERT INTO users_rooms(uid, rid) VALUES ($1, $2)`
				await db.query(joinRoomSQL, [uid, rid])

				const room = Rooms.create(nextRoom)
				user.joinRoom(room)

				clientCB({ success: "server success - createRoom()", room: room.clientCopy() })
			} catch (error) {
				error = `server error - createRoom() - ${error}`
				console.log(error)
				clientCB({ error })
			}
		})

		socket.on("joinRoom", async function ({ uid, rid, password = null, lastMsgTS }, clientCB) {
			let user = Users.get(uid)
			if (!rid || !user) {
				// console.log("uid:", uid, "user: ", user, "rid: ", rid)
				return clientCB({ error: "server error - joinRoom() - bad params" })
			}
			try {
				let room = Rooms.get(rid)
				if (room) {
					// Double check if user has already joined said room.
					if (room.contains(uid)) {
						return clientCB({
							success: "server success - joinRoom() - user already in room",
							room: room.clientCopy(),
						})
					}
				} else {
					const getRoomDataSQL = `SELECT rid, rname, password FROM rooms WHERE rid = $1`
					const roomRes = await db.query(getRoomDataSQL, [rid])
					if (roomRes.rows.length < 1) throw Error("room doesn't exist")
					room = Rooms.create(roomRes.rows[0])
				}
				// Check for and deal with room password. For now not hashing/encrypting.
				if (room.password && room.password !== password) throw Error("invalid room password")

				// Check if you've already joined the room or not in DB.
				const checkIfmyRoomsQL = `SELECT * FROM users_rooms WHERE uid = $1 AND rid = $2`
				const joinRoomCheckRes = await db.query(checkIfmyRoomsQL, [uid, rid])
				// If they haven't joined, create the DB row and add the joined room on the server.
				if (joinRoomCheckRes.rows.length < 1) {
					const joinRoomSQL = `INSERT INTO users_rooms(uid, rid) VALUES ($1, $2)`
					await db.query(joinRoomSQL, [uid, rid])
				}
				// Grab all the messages from the room their joining. Query changes based if given last msg timestamp.
				const getRoomMsgsSQL = `SELECT m.mid, m.msg, m.created_at, u.uid, u.uname FROM msgs m
					INNER JOIN users u ON m.uid = u.uid WHERE rid = $1
					AND m.created_at > ${lastMsgTS ? "$2" : "NOW() - INTERVAL '60 DAYS'"}
					ORDER BY m.created_at ASC`
				const msgsRes = await db.query(getRoomMsgsSQL, [rid, ...(lastMsgTS ? [lastMsgTS] : [])])

				user.joinRoom(rid)

				clientCB({
					success: "server success - joinRoom()",
					room: {
						...room.clientCopy(),
						msgs: row2obj(msgsRes.rows, "mid"),
					},
				})
			} catch (error) {
				error = `server error - joinRoom() - ${error}`
				console.log(error)
				clientCB({ error })
			}
		})

		socket.on("deleteRoom", async function ({ uid, rid }, clientCB) {
			try {
				const user = Users.get(uid)
				if (!user || !rid) throw Error("bad params")
				if (rid === 1) throw Error("can't leave or delete room 'General'")

				const leaveRoomSQL = `DELETE FROM users_rooms WHERE uid = $1 AND rid = $2`
				await db.query(leaveRoomSQL, [uid, rid])

				user.leaveRoom(rid)

				clientCB({ success: "server success - deleteRoom()" })
			} catch (error) {
				error = `server error - deleteRoom() - ${error}`
				console.log(error)
				clientCB({ error })
			}
		})

		socket.on("sendMsg", async function ({ msg, rid, uid }, clientCB) {
			const sendMsgQuery = `WITH m AS (
				INSERT INTO msgs(uid, rid, msg) VALUES ($1, $2, $3) RETURNING * )
				SELECT m.mid, m.uid, m.msg, m.created_at, u.uname FROM m
				INNER JOIN users u ON m.uid = u.uid`
			try {
				const insertMsgRes = await db.query(sendMsgQuery, [uid, rid, msg])
				const msgs = row2obj(insertMsgRes.rows, "mid")
				io.in(`${rid}`).emit("updateRoom", { ...Rooms.get(rid).clientCopy(), msgs })

				clientCB({ success: "server success - sendMsg()", msgs })
			} catch (error) {
				error = `server error - sendMsg() - ${error}`
				console.log(error)
				clientCB({ error })
			}
		})

		socket.on("log", function () {
			console.log("- - - - - - - - - - - - - - - - -")
			Rooms.log()
			Users.log()
			console.log("- - - - - - - - - - - - - - - - -")
		})

		socket.on("disconnecting", function () {
			Users.disconnect(socket.id)
		})
	})
}
