const express = require("express")
// const debug = require("debug")("server:routes-auth")

module.exports = function (passport) {
	const router = express.Router()
	// const queries = require("../db/queries")

	// function checkAdmin(req, res, next) {
	// 	if (req.isAuthenticated() && req.user && req.user.access === "admin") return next()
	// 	res.json({ error: "You are not an admin.", user: req.user })
	// }

	function checkAuth(req, res, next) {
		if (req.isAuthenticated() && req.user.access === "banned")
			return res.status(403).json({ error: "You are banned!", user: req.user })
		else if (req.isAuthenticated()) return next()
		else res.status(401).json({ error: "You are not authenticated with the server..." })
	}

	router.get("/user", checkAuth, function (req, res) {
		res.json({ user: req.user })
	})

	// router.put("/admin/ban-user", checkAdmin, async function (req, res) {
	// 	const { banUser } = req.body
	// 	try {
	// 		if (!banUser) throw Error("PUT /admin/ban-user error, no banUser object in req.body!")
	// 		const banRes = await queries.users.ban(banUser.pid)
	// 		if (banRes.rows.length < 1) throw Error("PUT /admin/ban-user error, couldn't retrieve user from DB!")
	// 		res.json({ banUser: banRes.rows[0] })
	// 	} catch (error) {
	// 		debug(error)
	// 		res.json({ error, reqBody: req.body })
	// 	}
	// })

	router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }))

	router.get(
		"/google/callback",
		passport.authenticate("google", { failureRedirect: "/" }),
		function (req, res) {
			res.redirect("/")
		}
	)

	router.get("/github", passport.authenticate("github", { scope: ["read:user"] }))

	router.get(
		"/github/callback",
		passport.authenticate("github", { failureRedirect: "/" }),
		function (req, res) {
			res.redirect("/")
		}
	)

	return router
}
