const express = require("express")
const router = express.Router()
const debug = require("debug")("server:routes-minesweeper")
const queries = require("../db/queries")

router.get("/my-scores", async function (req, res, next) {
	try {
		const { uid } = req.query
		if (!uid) throw Error("GET /myscores error - bad query params")
		const scores = await queries.minesweeper.getUserScores({ user_id: uid })
		res.json(scores.rows)
	} catch (error) {
		next(error)
	}
})

router.get("/leaderboard", async function (req, res, next) {
	try {
		const leaderboard = await queries.minesweeper.getTopScores()
		res.json(leaderboard.rows)
	} catch (error) {
		next(error)
	}
})

router.post("/submit-score", async function (req, res, next) {
	try {
		const { game_id, user_id, difficulty, time_sec, created_at } = req.body
		if (!game_id || !user_id || !difficulty || !time_sec || !created_at) {
			debug.log(req.body)
			throw Error("POST /submit-score error - bad req body")
		}
		const submitRes = await queries.minesweeper.submitScore({
			game_id,
			user_id,
			difficulty,
			time_sec,
			created_at,
		})
		res.json(submitRes.rows)
	} catch (error) {
		next(error)
	}
})

module.exports = router
