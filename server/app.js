require("dotenv").config({ path: "./.env.local" })

const express = require("express")
const app = express()
const session = require("express-session")
const db = require("./db/db")
const pgSession = require("connect-pg-simple")(session)
const passport = require("./passport")
const cookieParser = require("cookie-parser")
const morgan = require("morgan")
const cors = require("cors")
const helmet = require("helmet")

app.use(morgan("dev"))
app.use(helmet())
app.use(
	cors({
		origin: [process.env.ORIGIN_URL, process.env.SERVER_URL],
		credentials: true,
	})
)
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser(process.env.SESSION_SECRET))
const sessionMiddleware = session({
	name: "sessionID",
	store: new pgSession({ pool: db }),
	secret: process.env.SESSION_SECRET,
	resave: false,
	saveUninitialized: true,
	cookie: {
		maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
		...(app.get("env") === "production" && { secure: true }),
	},
})
app.use(sessionMiddleware)
app.use(passport.initialize())
app.use(passport.session())

if (process.env.NODE_ENV === "production") {
	app.use(express.static("client/build"))

	const path = require("path")
	app.get("*", function (req, res) {
		res.sendFile(path.resolve(__dirname, "client", "build", "index.html"))
	})
}

app.use("/", require("./routes/index"))
app.use("/auth", require("./routes/auth"))
app.use("/weather", require("./routes/weather"))

module.exports = {
	main: app,
	sessionMiddleware,
}
