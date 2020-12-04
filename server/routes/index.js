const express = require("express")
const router = express.Router()
const path = require("path")

const authCheck = (req, res, next) => {
	if (!req.user) {
		res.status(401).json({
			authenticated: false,
			message: "User not authenticated.",
		})
	} else {
		next()
	}
}

// router.use(
// 	express.static('client/build', {
// 		index: false,
// 	}),
// )

// router.get('*', function(req, res) {
// 	res.sendFile(path.join(__dirname, '../../client/public/index.html'))
// })

router.get("/", authCheck, (req, res) => {
	console.log("router.get() index")
	res.status(200).json({
		authenticated: true,
		message: "User is authenticated.",
		user: req.user,
		cookies: req.cookies,
	})
})

module.exports = router
