const db = require("./db")
const shared = require("../shared")

const users = {
	getUserByUname: async function (uname) {
		const selectSQL = `SELECT * FROM users WHERE uname = $1`
		let res = await db.query(selectSQL, [uname])
		if (res.rows.length < 1) {
			const insertSQL = `INSERT INTO users(uname) VALUES ($1) RETURNING *`
			res = await db.query(insertSQL, [uname])
		}
		return res.rows[0]
	},
	upsertAll: function ({ pid, email, uname }) {
		const insertUserSQL = `INSERT INTO users(pid, email, uname) VALUES ($1, $2, $3)
			ON CONFLICT (pid) DO UPDATE SET pid = EXCLUDED.pid RETURNING *`
		return db.query(insertUserSQL, [pid, email, uname])
	},
	getUserByPID: function (pid) {
		return db.query(`SELECT * FROM users WHERE pid = $1`, [pid])
	},
	ban: async function (pid) {
		await db.query(`UPDATE users SET access = 'banned' WHERE pid = $1`, [pid])
		return db.query(`SELECT * FROM users WHERE pid = $1`, [pid])
	},
}

const chat = {
	sendDM: function ({ uid, recip_id, msg }) {
		const sendDMSQL = `WITH d AS (
				INSERT INTO dms(uid, recip, msg) VALUES ($1, $2, $3) RETURNING *
			)
			SELECT d.dmid, d.uid, d.msg, d.created_at, u.uname, u.pid FROM d
			INNER JOIN users u ON d.uid = u.uid`
		return db.query(sendDMSQL, [uid, recip_id, msg])
	},
	getLogsDMS: async function ({ uid, recip_id, tsLogsFetched }) {
		const getLogsDMSSQL = `SELECT dms.dmid, dms.uid, dms.msg, dms.created_at, u.uname, u.pid FROM dms
			INNER JOIN users u ON dms.uid = u.uid
			WHERE ((dms.uid = $1 AND dms.recip = $2) OR (dms.uid = $2 AND dms.recip = $1))
				AND dms.created_at > ${tsLogsFetched ? "$3" : "NOW() - INTERVAL '90 DAYS'"}
				AND u.access != 'banned'
			ORDER BY dms.created_at ASC`
		const dmsRes = await db.query(getLogsDMSSQL, [uid, recip_id, ...(tsLogsFetched ? [tsLogsFetched] : [])])
		return shared.dataUnreadTransform(dmsRes.rows, { uid, uniqKey: "dmid" })
	},
	getMyDMS: function (uid) {
		const getAllDMsSQL = `
			WITH chats AS (SELECT * FROM dms_history h WHERE h.user1 = $1 OR h.user2 = $1)
			SELECT
				chats2.recip_id,
				r.uname AS recip_uname,
				r.pid AS recip_pid,
				u.uname,
				u.pid,
				dms.dmid,
				dms.uid,
				dms.msg,
				dms.created_at
			FROM (
				SELECT chats.user1 AS recip_id, chats.last_dm_between FROM chats
				UNION
				SELECT chats.user2 AS recip_id, chats.last_dm_between FROM chats
			) AS chats2
			INNER JOIN dms ON chats2.last_dm_between = dms.dmid
			INNER JOIN users r ON chats2.recip_id = r.uid
			INNER JOIN users u ON dms.uid = u.uid
			WHERE chats2.recip_id != $1 AND r.access != 'banned'
			ORDER BY dms.created_at DESC`
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
		const getMyRoomsSQL = `SELECT ur.rid, r.rname, r.password, m.created_at AS users_last_msg_ts
			FROM users_rooms ur
			LEFT JOIN rooms r ON ur.rid = r.rid
			LEFT JOIN msgs m ON ur.users_last_msg = m.mid
			WHERE ur.uid = $1 ORDER BY ur.users_last_msg DESC`
		return db.query(getMyRoomsSQL, [uid])
	},
	getRoomMsgs: async function ({ uid, rid, lastMsgTS }) {
		const getRoomMsgsSQL = `SELECT m.mid, m.msg, m.created_at, u.uid, u.uname, u.pid FROM msgs m
			INNER JOIN users u ON m.uid = u.uid
			WHERE rid = $1
				AND m.created_at > ${lastMsgTS ? "$2" : "NOW() - INTERVAL '60 DAYS'"}
				AND u.access != 'banned'
			ORDER BY m.created_at ASC`
		const msgsRes = await db.query(getRoomMsgsSQL, [rid, ...(lastMsgTS ? [lastMsgTS] : [])])
		return shared.dataUnreadTransform(msgsRes.rows, { uid, uniqKey: "mid" })
	},
	sendRoomMsg: function ({ uid, rid, msg }) {
		const sendMsgSQL = `WITH m AS (
				INSERT INTO msgs(uid, rid, msg) VALUES ($1, $2, $3) RETURNING *
			)
			SELECT m.mid, m.uid, m.msg, m.created_at, u.uname, u.pid FROM m
			INNER JOIN users u ON m.uid = u.uid`
		return db.query(sendMsgSQL, [uid, rid, msg])
	},
	setup: async function (user) {
		const [roomsRes, dmsRes] = await Promise.all([this.getMyRooms(user.uid), this.getMyDMS(user.uid)])

		const myDMS = dmsRes.rows.reduce((acc, cur) => {
			const { recip_id, recip_uname, recip_pid, ...dmData } = cur
			const unread = dmData.uid != user.uid
			acc[recip_id] = {
				recip_id,
				recip_uname,
				recip_pid,
				dms: {
					[dmData.dmid]: { ...dmData, unread },
					totalUnread: unread ? 1 : 0,
				},
			}
			return acc
		}, {})

		return {
			user,
			myRooms: shared.arr2obj(roomsRes.rows, "rid"),
			myDMS,
		}
	},
}

module.exports = {
	users,
	chat,
}
