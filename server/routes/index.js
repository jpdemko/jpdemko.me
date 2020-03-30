const express = require('express')
const router = express.Router()
const path = require('path')

// router.use(
// 	express.static('client/build', {
// 		index: false,
// 	}),
// )

// router.get('*', function(req, res) {
// 	res.sendFile(path.join(__dirname, '../../client/public/index.html'))
// })

router.get('/', function(req, res) {
	console.log('router.get() index')
})

module.exports = router
