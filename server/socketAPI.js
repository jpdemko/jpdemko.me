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

function trimUser(user) {
	return {
		socketID: user.socketID,
		dbID: user.dbID,
		name: user.name,
	}
}

module.exports = function(io, sessionMiddleware, db) {
	io.use(function(socket, next) {
		sessionMiddleware(socket.request, {}, next)
	})

	io.on("connection", function(socket) {
		console.log(`socket#${socket.id} connected`)

		socket.on("setupUser", function({ name }, clientCB) {
			if (!name) {
				clientCB({ error: "ERROR - IO SETUP USER - NO USERNAME GIVEN" })
				return
			}
			let user = users[name]
			if (user && user.socketID === socket.id) {
				//same user, figure out what to do
				clientCB({ success: "SUCCESS - IO SETUP USER - YOU'RE ALREADY SETUP", user })
			} else if (user && user.socketID !== socket.id) {
				//different user trying to get active name
				clientCB({ error: "ERROR - IO SETUP USER - USERNAME TAKEN" })
			} else {
				//user doesn't exist, create user
				user = {
					socketID: socket.id,
					rooms: [],
					name,
				}
				db.query("SELECT id FROM users WHERE username = $1", [name], function(selectErr, selectRes) {
					if (selectErr) {
						clientCB({ error: `ERROR - IO SETUP USER - DB SELECT ERROR: ${selectErr}` })
						return
					} else if (selectRes.rows.length === 0) {
						db.query("INSERT INTO users(username) VALUES($1) RETURNING *", [name], function(
							insertErr,
							insertRes,
						) {
							if (insertErr) {
								clientCB({ error: `ERROR - IO SETUP USER - DB INSERT ERROR: ${insertErr}` })
								return
							} else {
								user.dbID = insertRes.rows[0].id
								clientCB({ success: "SUCCESS - IO SETUP USER - DB USER CREATED", user })
							}
						})
					} else {
						user.dbID = selectRes.rows[0].id
						clientCB({ success: "SUCCESS - IO SETUP USER - USERNAME TAKEN", user })
					}
					users[name] = user
				})
			}
		})

		socket.on("joinRoom", function({ username, name: roomName, password: roomPassword }, clientCB) {
			if (!roomName || !username) {
				console.log(username, roomName, roomPassword)
				clientCB({ error: "ERROR - IO JOIN ROOM - INVALID VARS" })
				return
			}
			const user = users[username]
			let room = rooms[roomName]
			if (room) {
				if (room.users.find((u) => u.socketID === socket.id)) {
					clientCB({ success: "SUCCESS - IO JOIN ROOM - USER ALREADY IN ROOM", room: {} })
					return
				} else if (room.password && room.password !== roomPassword) {
					clientCB({ error: "ERROR - IO JOIN ROOM - INVALID PASSWORD" })
					return
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
			room.users.push(trimUser(user))
			clientCB({ success: "SUCCESS - IO JOIN ROOM - SUCCESSFULLY JOINED ROOM", room })
			// room = {name,users,password}
			socket.to(roomName).emit("updateRoom", room)
		})

		socket.on("getRoomMsgs", function({ roomName, daysToFetch = "60 DAYS" }, clientCB) {
			const getRoomMsgsQuery = `SELECT u.id, u.username, m.message, m.msg_created_at FROM messages m
				INNER JOIN users u ON m.user_id = u.id
				WHERE m.room = $1 AND m.msg_created_at >= NOW() - INTERVAL '$2'
				ORDER BY m.msg_created_at ASC`
			db.query(getRoomMsgsQuery, [roomName, daysToFetch], function(selectErr, selectRes) {
				if (selectErr) {
					clientCB({ error: `ERROR - IO GET ROOM MSGS - DB SELECT ERROR: ${selectErr}` })
					return
				}
				clientCB({ success: "SUCCESS - IO GET ROOM MSGS - DB SELECT SUCCESS", data: selectRes.rows })
			})
		})

		socket.on("disconnect", function() {
			const name = Object.keys(users).find((n) => users[n].socketID === socket.id)
			const user = users[name]
			if (!user) {
				console.log("WHY IS THIS HAPPENING")
				return
			}
			console.log(`user#${user.name} disconnected`)
			console.log("current rooms", rooms)
			user.rooms.forEach((roomName, i) => {
				const room = rooms[roomName]
				room.users = room.users.filter((u) => u.socketID !== user.socketID)
				if (room.users < 1) {
					console.log("no users in room, deleting field from server")
					delete rooms[roomName]
				} else io.in(roomName).emit("updateRoom", room)
				console.log(`user room #${i + 1}`, room ? room : "no users, deleted")
			})
			console.log(`deleted user ${socket.id}`)
			delete users[name]
			console.log("remaining users: ", users)
		})
	})
}
