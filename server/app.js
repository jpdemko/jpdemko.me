const express = require("express")
const session = require("express-session")
const pgSession = require("connect-pg-simple")(session)
const cookieParser = require("cookie-parser")
const morgan = require("morgan")
const cors = require("cors")
const helmet = require("helmet")
const debug = require("debug")("backend:server")
// Heroku packages for optimization?
const cluster = require("cluster")
const numCPUs = require("os").cpus().length

const dev = process.env.NODE_ENV !== "production"
let app = null

if (!dev && cluster.isMaster) {
	console.error(`Node cluster master ${process.pid} is running!`)
	// Fork workers.
	for (let i = 0; i < numCPUs; i++) {
		cluster.fork()
	}
	cluster.on("exit", (worker, code, signal) => {
		console.error(`Node cluster worker ${worker.process.pid} exited: code ${code}, signal ${signal}`)
	})
} else {
	if (dev) require("dotenv").config({ path: "./.env.local" })
	const db = require("./db/db")
	const passport = require("./passport")

	app = express()
	app.use(morgan(dev ? "dev" : "common"))
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
			...(dev && { secure: true }),
		},
	})
	app.use(sessionMiddleware)
	app.use(passport.initialize())
	app.use(passport.session())

	if (!dev) {
		const path = require("path")
		app.use(express.static(path.resolve(__dirname, "../client/build")))
		app.get("*", function (req, res) {
			res.sendFile(path.resolve(__dirname, "../client/build", "index.html"))
		})
	}

	app.use("/", require("./routes/index"))
	app.use("/auth", require("./routes/auth"))
	app.use("/weather", require("./routes/weather"))

	const server = require("http").createServer(app)
	const port = process.env.PORT || 5000
	app.set("port", port)

	// @ts-ignore
	const io = require("socket.io")(server, {
		cors: {
			origin: [process.env.ORIGIN_URL, process.env.SERVER_URL],
			methods: ["GET", "POST"],
			credentials: true,
		},
	})
	require("./socketAPI")(io, sessionMiddleware)

	server.listen(port)
	server.on("error", onError)
	server.on("listening", onListening)

	function onError(error) {
		if (error.syscall !== "listen") throw error

		const bind = typeof port === "string" ? "Pipe " + port : "Port " + port
		// Handle specific listen errors with friendly messages.
		switch (error.code) {
			case "EACCES":
				console.error(bind + " requires elevated privileges")
				process.exit(1)
			case "EADDRINUSE":
				console.error(bind + " is already in use")
				process.exit(1)
			default:
				throw error
		}
	}

	function onListening() {
		const addr = server.address()
		const bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port
		debug("Listening on " + bind)
	}
}
