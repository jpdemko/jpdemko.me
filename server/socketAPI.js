const activeUsers = {}
const activeRooms = {}

var User = {
	setup: function ({ uid, uname, socketID, joinedRooms = [] }) {
		if (!uid || !uname) throw Error("User.create() bad params")
		var self = Object.create(this)
		self.uid = uid
		self.uname = uname
		self.joinedRooms = joinedRooms
		self.socketID = socketID
		return self
	},
	amass: function () {
		const { uid, uname, socketID, joinedRooms } = this
		return {
			uid,
			uname,
			joinedRooms: joinedRooms.map(Rooms.get),
		}
	},
}

var Users = {
	active: {},
	setup: function (userData) {
		if (!userData || (userData && !userData.uid)) throw Error("Users.add() bad params")
		this.active[userData.uid] = User.setup(userData)
		return this.active[userData.uid]
	},
	get: function (uid) {
		return this.active[uid]
	},
	disconnect: function (sid) {
		const uid = Object.keys(this.active).find((uid) => this.active[uid].socketID === sid)
		const user = this.active[uid]
		user.joinedRooms.forEach((rid) => Rooms.get(rid).removeUser(uid))
		delete this.active[uid]
		return this
	},
	log: function () {
		console.log("### USERS ###")
		console.log(this.active)
	},
}

var Room = {
	create: function ({ rid, rname, activeUsers = [] }) {
		if (!rid || !rname) throw Error("Room.create() bad params")
		var self = Object.create(this)
		self.rid = rid
		self.rname = rname
		self.activeUsers = activeUsers
		return self
	},
	addUser: function (uid) {
		const user = Users.get(uid)
		if (!user) return
		user.joinedRooms.push(this.rid)
		this.activeUsers.push(user.uid)
		return this
	},
	removeUser: function (uid) {
		const user = Users.get(uid)
		if (!user) return
		user.joinedRooms = user.joinedRooms.filter((rid) => rid !== this.rid)
		this.activeUsers = this.activeUsers.filter((uid) => uid !== user.uid)
		Rooms.destroy(this.rid)
		return this
	},
	amass: function () {
		const { rid, rname, activeUsers } = this
		return {
			rid,
			rname,
			activeUsers: activeUsers.map(Users.get),
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
		if (this.active[rid]) delete this.active[rid]
	},
	log: function () {
		console.log("### ROOMS ### ")
		console.log(this.active)
	},
}

function leaveRoom(socket, uid, rid) {
	const room = activeRooms[rid]
	const user = activeUsers[uid]
	if (!room)
		return console.log(
			`leaveRoom() err, params: uid(${uid}), rid(${rid}), actRoomsLength(${
				Object.keys(activeRooms).length
			})`
		)
	room.activeUsers = room.activeUsers.filter((u) => u.uid !== uid)
	console.log(`${user.uname}#${user.uid} left room ${room.rname}#${room.rid}`)
	if (room.activeUsers < 1) delete activeRooms[rid]
	else socket.to(`${rid}`).emit("updateRoom", room)
}

module.exports = function (io, sessionMiddleware, db) {
	io.use(function (socket, next) {
		sessionMiddleware(socket.request, {}, next)
	})

	io.on("connection", function (socket) {
		console.log(`socket#${socket.id} connected`)

		socket.on("setupUser", async function ({ uid, uname }, clientCB) {
			if (!uname && !uid) return clientCB({ error: "server error - setupUser() - bad params" })

			// Check if user is already active.
			if (!uid) uid = Object.keys(activeUsers).find((uid) => activeUsers[uid].uname === uname)
			let user = activeUsers[uid]
			if (user) {
				if (user.socketID === socket.id)
					return clientCB({ success: "server success - setupUser() - you're already setup", user })
				else if (user.socketID !== socket.id)
					return clientCB({ error: "server error - setupUser() - username taken" })
			} else {
				try {
					const selectUserSQL = `SELECT uid, uname FROM users WHERE uname = $1`
					let userRes = await db.query(selectUserSQL, [uname])
					// If user doesn't exist, create user and join the default room.
					if (userRes.rows.length === 0) {
						const insertUserSQL = `INSERT INTO users(uname) VALUES($1) RETURNING uid, uname`
						userRes = await db.query(insertUserSQL, [uname])
						const joinGeneralChatSQL = `INSERT INTO joined_rooms(uid, rid) VALUES($1, 1)`
						await db.query(joinGeneralChatSQL, [userRes.rows[0].uid])
					}
					// Grab all the rooms the user is currently in.
					const getJoinedRoomsSQL = `SELECT r.rid, r.rname, r.password FROM rooms r
						INNER JOIN joined_rooms jr ON r.rid = jr.rid WHERE jr.uid = $1`
					const usersRoomsRes = await db.query(getJoinedRoomsSQL, [userRes.rows[0].uid])
					user = {
						...userRes.rows[0],
						joinedRooms: usersRoomsRes.rows,
					}
					activeUsers[user.uid] = {
						...user,
						socketID: socket.id,
					}
				} catch (error) {
					console.log(error)
					return clientCB({ error })
				}
			}
			console.log(
				"CUR USERS: ",
				Object.keys(activeUsers).map((uid) => activeUsers[uid].uname)
			)
			clientCB({ success: "server success - setupUser()", user })
		})

		socket.on("createRoom", async function ({ uid, rname, password = null }, clientCB) {
			const activeUser = activeUsers[uid]
			// Make sure password is null or a string with at least 6 char.
			const okPass = password === null || (typeof password === "string" && password.length > 5)
			if (!activeUser || !rname || !okPass) {
				console.log("user: ", activeUser, "rname: ", rname)
				return clientCB({ error: "server error - createRoom() - bad params" })
			}
			// Create room in DB and return room info (rid#, rname, password?) locally.
			try {
				const createRoomSQL = `INSERT INTO rooms(rname, password) VALUES ($1, $2)
					RETURNING rid, rname, password`
				const createRoomRes = await db.query(createRoomSQL, [rname, password])
				const nextRoom = createRoomRes.rows[0]
				const rid = nextRoom.rid

				// Add user annd room to joined_rooms table.
				const joinRoomSQL = `INSERT INTO joined_rooms(uid, rid) VALUES ($1, $2)`
				await db.query(joinRoomSQL, [uid, rid])

				const { joinedRooms, ...userData } = activeUser
				activeRooms[rid] = {
					activeUsers: [{ ...userData }],
					...nextRoom,
				}
				activeUser.joinedRooms.push(activeRooms[rid])
				socket.join(`${rid}`)

				console.log(`${activeUser.uname}#${activeUser.uid} joined room ${nextRoom.rname}#${nextRoom.rid}`)
				clientCB({ success: "server success - createRoom()", room: activeRooms[rid] })
			} catch (error) {
				console.log(error)
				clientCB({ error })
			}
		})

		socket.on("joinRoom", async function ({ uid, rid, password = null, lastMsgTS }, clientCB) {
			const activeUser = activeUsers[uid]
			if (!rid || !activeUser) {
				console.log("uid:", uid, "user: ", activeUser, "rid: ", rid)
				return clientCB({ error: "server error - joinRoom() - bad params" })
			}
			try {
				let activeRoom = activeRooms[rid]
				if (!activeRoom) {
					const getRoomDataSQL = `SELECT rid, rname, password FROM rooms WHERE rid = $1`
					const roomRes = await db.query(getRoomDataSQL, [rid])
					activeRooms[rid] = {
						activeUsers: [],
						...roomRes.rows[0],
					}
					activeRoom = activeRooms[rid]
				}
				// Double check if user has already joined said room.
				if (activeRoom.activeUsers.find((u) => u.uid === uid)) {
					return clientCB({
						success: "server success - joinRoom() - user already in room",
						room: activeRoom,
					})
				}
				// Check for and deal with room password. For now not hashing/encrypting.
				if (activeRoom.password && activeRoom.password !== password)
					throw new Error("invalid room password")
				// Check if you've already joined the room or not in DB.
				const checkIfJoinedRoomSQL = `SELECT * FROM joined_rooms WHERE uid = $1 AND rid = $2`
				const joinRoomCheckRes = await db.query(checkIfJoinedRoomSQL, [uid, rid])
				// If they haven't joined, create the DB row and add the joined room on the server.
				if (joinRoomCheckRes.rows.length < 1) {
					const joinRoomSQL = `INSERT INTO joined_rooms(uid, rid) VALUES ($1, $2)`
					await db.query(joinRoomSQL, [uid, rid])
				}
				// Grab all the messages from the room their joining. Query changes based if given last msg timestamp.
				const getRoomMsgsSQL = `SELECT m.mid, m.message, m.created_at, u.uid, u.uname FROM messages m
					INNER JOIN users u ON m.uid = u.uid WHERE rid = $1
					AND m.created_at > ${lastMsgTS ? "$2" : "NOW() - INTERVAL '60 DAYS'"}
					ORDER BY m.created_at ASC`
				const msgsRes = await db.query(getRoomMsgsSQL, [rid, ...(lastMsgTS ? [lastMsgTS] : [])])

				// Prevent circular reference from 'joinedRooms' in an 'activeUser'. Only need 'userData' from DB.
				// Call stack will exceed in passing of data (from transform) in network if circular reference passed.
				const { joinedRooms, ...userData } = activeUser
				activeRoom.activeUsers.push({ ...userData })
				activeUser.joinedRooms.push(activeRoom)

				socket.join(`${rid}`)
				socket.to(`${rid}`).emit("updateRoom", activeRoom)
				console.log(
					`${activeUser.uname}#${activeUser.uid} joined room ${activeRoom.rname}#${activeRoom.rid}`
				)
				clientCB({
					success: "server success - joinRoom()",
					room: {
						...activeRoom,
						msgs: msgsRes.rows,
					},
				})
			} catch (error) {
				console.log(error)
				clientCB({ error: `server error - joinRoom() - ${error}` })
			}
		})

		socket.on("leaveRoom", async function ({ uid, rid }, clientCB) {
			if (!uid || !rid) return clientCB({ error: "server error - leaveRoom() - bad params" })
			if (rid === 1) return clientCB({ error: "server error - leaveRoom() - can't leave 'General'" })
			try {
				const leaveRoomSQL = `DELETE FROM joined_rooms WHERE uid = $1 AND rid = $2`
				await db.query(leaveRoomSQL, [uid, rid])
				leaveRoom(socket, uid, rid)
				clientCB({ success: "server success - leaveRoom()" })
			} catch (error) {
				console.log(error)
				clientCB({ error: `server error - leaveRoom() - ${error}` })
			}
		})

		socket.on("sendMsg", async function ({ msg, rid, uid }, clientCB) {
			const sendMsgQuery = `WITH m AS (
				INSERT INTO messages(uid, rid, message) VALUES ($1, $2, $3) RETURNING * )
				SELECT m.mid, m.uid, m.message, m.created_at, u.uname FROM m
				INNER JOIN users u ON m.uid = u.uid`
			try {
				const insertMsgRes = await db.query(sendMsgQuery, [uid, rid, msg])
				io.in(`${rid}`).emit("updateRoom", { ...activeRooms[rid], msgs: insertMsgRes.rows })
				clientCB({ success: "server success - sendMsg()", msgs: insertMsgRes.rows })
			} catch (error) {
				console.log(error)
				clientCB({ error: `server error - sendMsg() - ${error}` })
			}
		})

		socket.on("log", function (clientCB) {
			console.log(io.sockets.adapter.rooms)
			clientCB({ activeRooms, activeUsers })
		})

		socket.on("disconnect", function () {
			const uid = Object.keys(activeUsers).find((uid) => activeUsers[uid].socketID === socket.id)
			const user = activeUsers[uid]
			console.log(`${user.uname}#${user.uid} disconnected`)
			if (!user) {
				console.log("server error - prob. server restart not getting data from reconnecting clients")
				return
			}
			// Go through user's rooms and remove him from them.
			user.joinedRooms.forEach((room) => leaveRoom(socket, uid, room.rid))
			delete activeUsers[uid]
			console.log("CUR ROOMS: ", Object.keys(activeRooms), "CUR USERS: ", Object.keys(activeUsers))
			console.log("- - - - - - - - -")
		})
	})
}
