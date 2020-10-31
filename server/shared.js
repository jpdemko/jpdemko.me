/**
 * Turns node-pg query result (array of objects) into a single object with each element of the array
 * being a K,V pair. The key will be the passed uniqColumnName or a column containing 'id'.
 * @param {Array<Object>} arr
 * @param {string} [uniqKey]
 * @returns {Object}
 */
function arr2obj(arr, uniqKey) {
	return arr.reduce((acc, obj) => {
		if (!uniqKey) uniqKey = Object.keys(obj).find((key) => key.includes("id"))
		if (obj.msg && obj.unread) acc.unread = (acc.unread ? acc.unread : 0) + 1
		acc[obj[uniqKey]] = obj
		return acc
	}, {})
}

/**
 * 1. Every msg will be made unread unless optional UID is passed, which will change the default
 * behavior to make every message after the user's last message unread instead.
 *
 * 2. Deep copied msgs array will then be transformed into an object of objects.
 * @param {Array<Object>} msgsRow
 * @param {Object} [options={}]
 * @param {string|number} [options.uid]
 * @param {string} [options.uniqKey]
 * @returns {Object}
 */
function transformMsgs(msgsRow, options = {}) {
	const msgs = msgsRow.slice()
	let startIdx = 0
	if (options.uid) {
		for (let i = msgs.length - 1; i > 0; i--) {
			if (msgs[i].uid == options.uid) {
				startIdx = i
				break
			}
		}
	}
	for (let i = 0; i < msgs.length; i++) {
		msgs[i] = {
			...msgs[i],
			unread: msgs[i].uid != options.uid && i >= startIdx,
		}
	}
	return arr2obj(msgs, options.uniqKey)
}

module.exports = {
	arr2obj,
	transformMsgs,
}
