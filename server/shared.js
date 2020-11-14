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
 * 1. Every msg/DM will be made unread unless optional UID is passed, which will change the default
 * behavior to make every msg/DM after the user's last msg/DM unread instead.
 *
 * 2. Deep copied msg/DM array will then be transformed into an object of objects.
 * @param {Array<Object>} row
 * @param {Object} [options={}]
 * @param {string|number} [options.uid]
 * @param {string} [options.uniqKey]
 * @returns {Object}
 */
function dataUnreadTransform(row, options = {}) {
	const data = row.slice()
	let startIdx = 0
	if (options.uid) {
		for (let i = data.length - 1; i > 0; i--) {
			if (data[i].uid == options.uid) {
				startIdx = i
				break
			}
		}
	}
	for (let i = 0; i < data.length; i++) {
		data[i] = {
			...data[i],
			unread: data[i].uid != options.uid && i >= startIdx,
		}
	}
	return arr2obj(data, options.uniqKey)
}

module.exports = {
	arr2obj,
	dataUnreadTransform,
}
