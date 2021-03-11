const express = require("express")
const router = express.Router()
const fetch = require("node-fetch")
const debug = require("debug")("server:routes-weather")

router.get("/sun", function (req, res, next) {
	const { lat, lng, locDate } = req.query
	if (!lat || !lng || !locDate) throw Error("GET /sun error - bad query params")

	const sunAPI = "https://api.sunrise-sunset.org/json"
	const params = `?lat=${lat}&lng=${lng}&formatted=0&date=${locDate}`
	fetch(`${sunAPI}${params}`)
		.then((apiRes) => apiRes.json())
		.then((data) => res.json(data))
		.catch((err) => {
			debug("GET /sun error: ", err)
			next(err)
		})
})

router.get("/forecast", function (req, res, next) {
	const { lat, lng } = req.query
	if (!lat || !lng) throw Error("GET /forecast error - bad query params")

	const darkskyAPI = "https://api.darksky.net/forecast/"
	const params = `${process.env.DARK_SKY_API_KEY}/${lat},${lng}?exclude=minutely`
	fetch(`${darkskyAPI}${params}`)
		.then((apiRes) => apiRes.json())
		.then((data) => res.json(data))
		.catch((err) => {
			debug("GET /forecast error: ", err)
			next(err)
		})
})

module.exports = router
