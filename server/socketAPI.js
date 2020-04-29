const rooms = {}
const users = {}

// function genUser(socket) {
// 	let user = null
// 	try {
// 		const { name, email } = socket.request.session.passport.user
// 		console.log(`passport data: ${name}, ${email}`)
// 		user = {
// 			id: socket.id,
// 			name,
// 			email,
// 		}
// 	} catch (error) {
// 		user = { id: socket.id, name: socket.id }
// 	}
// 	user.rooms = []
// 	users[socket.id] = user
// 	console.log(`user#${user.name} connected`)
// 	return users[socket.id]
// }

function leaveRoom(socket, user, roomName) {
	const room = rooms[roomName]
	if (!room) return console.log("ERROR: leaveRoom() called on room that doesn't exist!")
	room.users = room.users.filter((u) => u.socketID !== user.socketID)
	if (room.users < 1) delete rooms[roomName]
	else socket.to(roomName).emit("updateRoom", room)
}

module.exports = function (io, sessionMiddleware, db) {
	io.use(function (socket, next) {
		sessionMiddleware(socket.request, {}, next)
	})

	io.on("connection", function (socket) {
		console.log(`socket#${socket.id} connected`)

		socket.on("setupUser", async function (uname, clientCB) {
			if (!uname) return clientCB({ error: "server error - setupUser() - bad params" })

			const uid = Object.keys(users).find((uid) => users[uid].uname === uname)
			let user = users[uid]
			if (user && user.socketID === socket.id) {
				// Handle same user.
				clientCB({ success: "server success - setupUser() - you're already setup", user })
			} else if (user && user.socketID !== socket.id) {
				// New user trying to get taken name.
				clientCB({ error: "server error - setupUser() - username taken" })
			} else {
				// Username not taken from server.
				try {
					const selectUserSQL = `SELECT uid FROM users WHERE uname = $1`
					let userRes = await db.query(selectUserSQL, [uname])
					if (userRes.rows.length === 0) {
						const insertUserSQL = `INSERT INTO users(uname) VALUES($1) RETURNING *`
						userRes = await db.query(insertUserSQL, [uname])
					}
					user = {
						socketID: socket.id,
						uid: userRes.rows[0].uid,
						uname,
						rooms: [],
					}
					users[user.uid] = user
					clientCB({ success: "server success - setupUser()", user })
				} catch (error) {
					console.log(error)
					clientCB({ error })
				}
			}
		})

		socket.on("createRoom", async function ({ uid, rname, password = null }, clientCB) {
			const user = users[uid]
			if (!user || !rname) {
				console.log("user: ", user, "rname: ", rname)
				return clientCB({ error: "server error - createRoom() - bad params" })
			}
			// create room in DB, return room info, (rid#, rname, password?) locally
			try {
				const createRoomSQL = `INSERT INTO rooms(rname, password) VALUES ($1, $2) RETURNING *`
				const createRoomRes = await db.query(createRoomSQL, [rname, password])
				const roomRes = createRoomRes.rows[0]

				// create permissions for uid to enter rid in rooms_users table
				const createPermSQL = `INSERT INTO rooms_users(rid, uid) VALUES ($1, $2)`
				const createPermRes = await db.query(createPermSQL, [roomRes.rid, uid])

				// return room info to user
				clientCB({ success: "SERVER SUCCESS - IO CREATE ROOM", room: roomRes })
			} catch (error) {
				console.log(error)
				clientCB({ error })
			}
		})

		socket.on("joinRoom", function ({ uname, rid, rname, password, lastMsgTS }, clientCB) {
			// const user = users[uname]
			// if (!rname || !user) {
			// 	console.log(uname, user, rname)
			// 	return clientCB({ error: "SERVER ERROR - IO JOIN ROOM - INVALID VARS" })
			// }
			// let room = rooms[rname]
			// if (room) {
			// 	if (room.users.find((u) => u.socketID === socket.id)) {
			// 		return clientCB({ success: "SERVER SUCCESS - IO JOIN ROOM - USER ALREADY IN ROOM" })
			// 	} else if (room.password && room.password !== password) {
			// 		return clientCB({ error: "SERVER ERROR - IO JOIN ROOM - INVALID PASSWORD" })
			// 	}
			// } else {
			// 	rooms[rname] = {
			// 		name: rname,
			// 		users: [],
			// 		...(password && { password: password }),
			// 	}
			// 	room = rooms[rname]
			// }
			// socket.join(rname)
			// user.rooms.push(rname)
			// room.users.push(user)
			// const getRoomMsgsQuery = `SELECT u.uname, m.mid, m.message, m.created_at, m.author
			// 	FROM messages m INNER JOIN users u ON m.author = u.uid
			// 	WHERE m.room = $1 AND m.created_at > ${lastMsgTS ? "$2" : "NOW() - INTERVAL '60 DAYS'"}
			// 	ORDER BY m.created_at ASC`
			// const getRoomMsgsParams = [rname, ...(lastMsgTS ? [lastMsgTS] : [])]
			// db.query(getRoomMsgsQuery, getRoomMsgsParams, function (selectErr, selectRes) {
			// 	if (selectErr) {
			// 		return clientCB({ error: `SERVER ERROR - IO GET ROOM MSGS - DB SELECT ERROR: ${selectErr}` })
			// 	}
			// 	msgs = selectRes.rows
			// 	socket.to(rname).emit("updateRoom", room)
			// 	clientCB({
			// 		success: "SERVER SUCCESS - IO JOIN ROOM - SUCCESSFULLY JOINED ROOM",
			// 		room: { ...room, msgs: selectRes.rows },
			// 	})
			// })
		})

		socket.on("leaveRoom", function ({ username, roomName }, clientCB) {
			if (!username || !roomName) return clientCB({ error: "SERVER ERROR - IO LEAVE ROOM - INVALID VARS" })
			const user = users[username]
			leaveRoom(socket, user, roomName)
			clientCB({ success: "SERVER SUCCESS - IO LEAVE ROOM" })
		})

		socket.on("sendMsg", function ({ msg, roomName, uid }, clientCB) {
			const sendMsgQuery = `WITH m AS (
				INSERT INTO messages(room, message, author) VALUES ($1, $2, $3) RETURNING * )
				SELECT m.mid, m.message, m.msg_created_at, m.author, u.username FROM m
				INNER JOIN users u ON m.author = u.uid`
			db.query(sendMsgQuery, [roomName, msg, uid], function (insertErr, insertRes) {
				if (insertErr) {
					clientCB({ error: `SERVER ERROR - IO SEND MSG - DB INSERT ERROR: ${insertErr}` })
					return
				}
				io.in(roomName).emit("updateRoom", { ...rooms[roomName], msgs: insertRes.rows })
				clientCB({ success: "SERVER SUCCESS - IO SEND MSG - DB CREATED MSG", msgs: insertRes.rows })
			})
		})

		socket.on("disconnect", function () {
			console.log(`socket#${socket.id} disconnected`)
			const name = Object.keys(users).find((n) => users[n].socketID === socket.id)
			const user = users[name]
			if (!user) {
				console.log("SERVER ERROR - Prob. server restart not getting data from reconnecting clients.")
				return
			}
			// Go through user's rooms and remove him from them.
			user.rooms.forEach((roomName) => leaveRoom(socket, user, roomName))
			delete users[name]
			console.log("CUR ROOMS: ", Object.keys(rooms), "CUR USERS: ", Object.keys(users))
			console.log("- - - - - - - - -")
		})
	})
}
