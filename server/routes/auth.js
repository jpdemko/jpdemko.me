const express = require("express")
const router = express.Router()
const passport = require("../passport")
const debug = require("debug")("server:routes-auth")

function checkAuth(req, res, next) {
	if (req.isAuthenticated()) return next()
	debug("checkAuth() failed, user: ", req.user)
	res.json({ error: "User is not authenticated." })
}

router.get("/user", checkAuth, function (req, res) {
	debug("GET /user success, user: ", req.user)
	res.json(req.user)
})

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }))

router.get(
	"/google/callback",
	passport.authenticate("google", { failureRedirect: "/" }, function (req, res) {
		res.redirect("/")
	})
)

router.get("/github", passport.authenticate("github", { scope: ["read:user"] }))

router.get(
	"/github/callback",
	passport.authenticate("github", { failureRedirect: "/" }, function (req, res) {
		res.redirect("/")
	})
)

module.exports = router
