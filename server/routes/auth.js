const express = require("express")
const router = express.Router()
const passport = require("../passport")

function checkAuth(req, res, next) {
	if (req.isAuthenticated()) return next()
	res.json({ error: "User is not authenticated." })
}

router.get("/user", checkAuth, function (req, res) {
	res.json(req.user)
})

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }))

router.get(
	"/google/callback",
	passport.authenticate("google", {
		failureRedirect: "/",
		successRedirect: "/",
	})
)

router.get("/github", passport.authenticate("github", { scope: ["read:user"] }))

router.get(
	"/github/callback",
	passport.authenticate("github", {
		failureRedirect: "/",
		successRedirect: "/",
	})
)

module.exports = router
