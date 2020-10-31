const db = require("./db")
const shared = require("../shared")

async function setUserByUname(uname) {
	const insertUserSQL = `INSERT INTO users(uname) VALUES ($1) ON CONFLICT (uname)
		DO UPDATE SET uname = EXCLUDED.uname RETURNING uid, uname`
	const res = await db.query(insertUserSQL, [uname])
	return res.rows[0]
}

const chat = {
	getMyDMs: function (uid) {
		const getAllDMsSQL = `
			WITH chats AS (SELECT * FROM dms_history h WHERE h.user1 = $1 OR h.user2 = $1)
			SELECT
				chats2.user1 AS recip_id,
				u.uname AS recip_uname,
				chats2.last_dm_between AS dmid,
				dms.msg,
				dms.created_at
			FROM (
				SELECT chats.user1, chats.last_dm_between FROM chats
				UNION
				SELECT chats.user2, chats.last_dm_between FROM chats
			) AS chats2
			INNER JOIN users u ON chats2.user1 = u.uid
			INNER JOIN dms ON chats2.last_dm_between = dms.dmid
			WHERE chats2.user1 != $1 ORDER BY dms.created_at DESC`
		return db.query(getAllDMsSQL, [uid])
	},
	createRoom: async function ({ uid, rname, password }) {
		const createRoomSQL = `INSERT INTO rooms(rname, password) VALUES ($1, $2)
			RETURNING rid, rname, password`
		const createRoomRes = await db.query(createRoomSQL, [rname, password])
		const room = createRoomRes.rows[0]
		const joinRoomSQL = `INSERT INTO users_rooms(uid, rid) VALUES ($1, $2)`
		await db.query(joinRoomSQL, [uid, room.rid])
		return room
	},
	getRoom: function (rid) {
		const getRoomDataSQL = `SELECT rid, rname, password FROM rooms WHERE rid = $1`
		return db.query(getRoomDataSQL, [rid])
	},
	joinRoom: function ({ uid, rid }) {
		const insertUserSQL = `INSERT INTO users_rooms(uid, rid) VALUES ($1, $2) ON CONFLICT (uid, rid)
			DO UPDATE SET rid = EXCLUDED.rid RETURNING *`
		return db.query(insertUserSQL, [uid, rid])
	},
	deleteRoom: function ({ uid, rid }) {
		const leaveRoomSQL = `DELETE FROM users_rooms WHERE uid = $1 AND rid = $2`
		return db.query(leaveRoomSQL, [uid, rid])
	},
	getMyRooms: function (uid) {
		console.log("queries getMyRooms() uid: ", uid)
		const getMyRoomsSQL = `SELECT ur.rid, r.rname, r.password, m.created_at AS users_last_msg_ts
			FROM users_rooms ur
			LEFT JOIN rooms r ON ur.rid = r.rid
			LEFT JOIN msgs m ON ur.users_last_msg = m.mid
			WHERE ur.uid = $1 ORDER BY ur.users_last_msg DESC`
		return db.query(getMyRoomsSQL, [uid])
	},
	getRoomMsgs: async function ({ uid, rid, lastMsgTS }) {
		const getRoomMsgsSQL = `SELECT m.mid, m.msg, m.created_at, u.uid, u.uname FROM msgs m
			INNER JOIN users u ON m.uid = u.uid WHERE rid = $1
			AND m.created_at > ${lastMsgTS ? "$2" : "NOW() - INTERVAL '60 DAYS'"}
			ORDER BY m.created_at ASC`
		const msgsRes = await db.query(getRoomMsgsSQL, [rid, ...(lastMsgTS ? [lastMsgTS] : [])])
		return shared.transformMsgs(msgsRes.rows, { uid, uniqKey: "mid" })
	},
	sendRoomMsg: function ({ uid, rid, msg }) {
		const sendMsgQuery = `WITH m AS (
				INSERT INTO msgs(uid, rid, msg) VALUES ($1, $2, $3) RETURNING *
			)
			SELECT m.mid, m.uid, m.msg, m.created_at, u.uname FROM m
			INNER JOIN users u ON m.uid = u.uid`
		return db.query(sendMsgQuery, [uid, rid, msg])
	},
	setup: async function (uname) {
		const user = await setUserByUname(uname)
		const data = await Promise.all([this.getMyRooms(user.uid), this.getMyDMs(user.uid)])
		console.log("setup:", data)
		return {
			user,
			myRooms: shared.arr2obj(data[0].rows, "rid"),
			myDMs: shared.arr2obj(data[1].rows, "dmid"),
		}
	},
}

module.exports = {
	setUserByUname,
	chat,
}
