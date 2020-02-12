const express = require('express')
const router = express.Router()

router.get('/', (req, res, next) => {
	console.log('req from client from index route /')
	res.json('index route hello')
})

module.exports = router
