const express = require("express")
const router = express.Router()

// const authCheck = (req, res, next) => {
// 	if (!req.user) {
// 		res.status(401).json({
// 			authenticated: false,
// 			message: "User not authenticated.",
// 		})
// 	} else {
// 		next()
// 	}
// }

router.get("/", (req, res) => {
	res.status(200).send("I should only see this testing CRA local via it's proxy...")
})

module.exports = router
