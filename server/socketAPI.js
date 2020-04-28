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

		socket.on("setupUser", function (name, clientCB) {
			if (!name) return clientCB({ error: "SERVER ERROR - IO SETUP USER - NO USERNAME GIVEN" })
			let user = users[name]
			if (user && user.socketID === socket.id) {
				// Handle same user.
				clientCB({ success: "SERVER SUCCESS - IO SETUP USER - YOU'RE ALREADY SETUP", user })
			} else if (user && user.socketID && user.socketID !== socket.id) {
				// New user trying to get taken name.
				clientCB({ error: "SERVER ERROR - IO SETUP USER - USERNAME ALREADY TAKEN" })
			} else {
				// Username not taken on server, handle this with DB info.
				user = {
					socketID: socket.id,
					rooms: [],
					name,
				}
				db.query("SELECT uid FROM users WHERE uname = $1", [name], function (selectErr, selectRes) {
					if (selectErr) {
						clientCB({ error: `SERVER ERROR - IO SETUP USER - DB SELECT ERROR: ${selectErr}` })
					} else if (selectRes.rows.length === 0) {
						// If you can't find the user, create a row for them in the DB.
						db.query("INSERT INTO users(uname) VALUES($1) RETURNING *", [name], function (
							insertErr,
							insertRes
						) {
							if (insertErr) {
								clientCB({ error: `SERVER ERROR - IO SETUP USER - DB INSERT ERROR: ${insertErr}` })
							} else {
								user.uid = insertRes.rows[0].uid
								clientCB({ success: "SERVER SUCCESS - IO SETUP USER - DB USER CREATED", user })
							}
						})
					} else {
						// Else, user was already in DB, but is available for taking currently.
						user.uid = selectRes.rows[0].uid
						clientCB({ success: "SERVER SUCCESS - IO SETUP USER - USERNAME WAS AVAILABLE", user })
					}
					users[name] = user
				})
			}
		})

		socket.on("joinRoom", function ({ username, roomName, password: roomPassword, lastMsgTS }, clientCB) {
			const user = users[username]
			if (!roomName || !user) {
				console.log(username, user, roomName)
				return clientCB({ error: "SERVER ERROR - IO JOIN ROOM - INVALID VARS" })
			}
			let room = rooms[roomName]
			if (room) {
				if (room.users.find((u) => u.socketID === socket.id)) {
					return clientCB({ success: "SERVER SUCCESS - IO JOIN ROOM - USER ALREADY IN ROOM" })
				} else if (room.password && room.password !== roomPassword) {
					return clientCB({ error: "SERVER ERROR - IO JOIN ROOM - INVALID PASSWORD" })
				}
			} else {
				rooms[roomName] = {
					name: roomName,
					users: [],
					...(roomPassword && { password: roomPassword }),
				}
				room = rooms[roomName]
			}
			socket.join(roomName)
			user.rooms.push(roomName)
			room.users.push(user)

			const getRoomMsgsQuery = `SELECT u.uname, m.mid, m.message, m.created_at, m.author
				FROM messages m INNER JOIN users u ON m.author = u.uid
				WHERE m.room = $1 AND m.created_at > ${lastMsgTS ? "$2" : "NOW() - INTERVAL '60 DAYS'"}
				ORDER BY m.created_at ASC`
			const getRoomMsgsParams = [roomName, ...(lastMsgTS ? [lastMsgTS] : [])]
			db.query(getRoomMsgsQuery, getRoomMsgsParams, function (selectErr, selectRes) {
				if (selectErr) {
					return clientCB({ error: `SERVER ERROR - IO GET ROOM MSGS - DB SELECT ERROR: ${selectErr}` })
				}
				msgs = selectRes.rows
				socket.to(roomName).emit("updateRoom", room)
				clientCB({
					success: "SERVER SUCCESS - IO JOIN ROOM - SUCCESSFULLY JOINED ROOM",
					room: { ...room, msgs: selectRes.rows },
				})
			})
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
