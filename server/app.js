/* eslint-disable no-fallthrough */
/* eslint-disable no-inner-declarations */

const path = require("path")

const isProd = process.env.NODE_ENV === "production"
const isHerokuLocal = process.env.HEROKU_LOCAL

if (!isProd && !isHerokuLocal) {
	const devEnvPath = require("find-config")(".env")
	require("dotenv").config({ path: devEnvPath })
}

const express = require("express")
const session = require("express-session")
const pgSession = require("connect-pg-simple")(session)
const cookieParser = require("cookie-parser")
const morgan = require("morgan")
const cors = require("cors")
const helmet = require("helmet")
const debug = require("debug")("server:app")
const passport = require("passport")
const compression = require("compression")
// const rateLimiter = require("express-rate-limit")

// Heroku packages for optimization?
const cluster = require("cluster")
const numCPUs = require("os").cpus().length

if (!isProd) console.log(`HELLO!!! isProd: ${isProd}, isHerokuLocal: ${isHerokuLocal}`)

let app = null

if (isProd && cluster.isMaster) {
	debug(`Node cluster master ${process.pid} is running!`)
	// Fork workers.
	for (let i = 0; i < numCPUs; i++) {
		cluster.fork()
	}
	cluster.on("exit", (worker, code, signal) => {
		debug(`Node cluster worker ${worker.process.pid} exited: code ${code}, signal ${signal}`)
	})
} else {
	const db = require("./db/db")
	app = express()

	if (isProd || isHerokuLocal) app.use(express.static(path.resolve(__dirname, "../client/build")))

	if (isProd) {
		app.use(compression())
		app.set("trust proxy", 1)
	}
	app.use(morgan(isProd ? "common" : "dev"))
	app.use(
		helmet({
			contentSecurityPolicy: {
				directives: {
					...helmet.contentSecurityPolicy.getDefaultDirectives(),
					"default-src": [
						"'self'",
						"https://polyfill.io",
						"https://*.bing.com",
						"https://*.virtualearth.net",
					],
					"script-src": [
						"'self'",
						"https://polyfill.io",
						"'unsafe-eval'",
						"https://*.bing.com",
						"https://*.virtualearth.net",
					],
					"style-src": ["'self'", "'unsafe-inline'", "https://*.bing.com", "https://*.virtualearth.net"],
					"font-src": ["data:", "'self'", "https://*.bing.com", "https://*.virtualearth.net"],
					"img-src": [
						"data:",
						"'self'",
						"https://*.bing.com",
						"https://*.virtualearth.net",
						"https://mesonet.agron.iastate.edu",
					],
					"connect-src": [
						"ws:",
						"wss:",
						"'self'",
						"http://localhost:5000",
						"ws://localhost:5000",
						"wss://localhost:5000",
						"ws://*.jpdemko.me",
						"wss://*.jpdemko.me",
						"https://*.jpdemko.me",
						"https://*.bing.com",
						"https://*.virtualearth.net",
						"accounts.google.com",
					],
				},
			},
		})
	)
	const corsOptions = {
		origin: isProd ? "https://www.jpdemko.me" : ["http://localhost:3000", "http://localhost:5000"],
		credentials: true,
	}
	app.use(cors(corsOptions))
	app.use(express.json())
	app.use(express.urlencoded({ extended: false }))
	app.use(cookieParser(process.env.SESSION_SECRET))
	const sessionMW = session({
		name: "jpd.sid",
		store: new pgSession({ pool: db }),
		secret: process.env.SESSION_SECRET,
		resave: true,
		saveUninitialized: true,
		cookie: {
			maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
			secure: isProd,
		},
	})
	app.use(sessionMW)
	app.use(passport.initialize())
	app.use(passport.session())

	// ROUTES
	app.use("/auth", require("./routes/auth")(passport))
	app.use("/weather", require("./routes/weather"))
	if (isProd || isHerokuLocal) {
		app.get("*", function (req, res) {
			res.sendFile(path.resolve(__dirname, "../client/build", "index.html"))
		})
	} else app.use("/", require("./routes/index"))

	// GENERIC ERROR HANDLER
	app.use(function (err, req, res, next) {
		console.error(err)
		res.status(err.status || 500).send({
			error: {
				status: err.status || 500,
				message: err.message || "Internal Server Error",
			},
		})
	})

	require("./passport")(passport)

	const server = require("http").createServer(app)
	const port = process.env.PORT || 5000
	app.set("port", port)

	const io = require("socket.io")(server, { cors: corsOptions })
	// https://socket.io/docs/v3/middlewares/
	const wrap = (middleware) => (socket, next) => middleware(socket.request, {}, next)
	io.use(wrap(sessionMW))
	io.use(wrap(passport.initialize()))
	io.use(wrap(passport.session()))
	require("./socketAPI")(io)

	server.listen(port)
	server.on("error", onError)
	server.on("listening", onListening)

	function onError(error) {
		if (error.syscall !== "listen") throw error

		const bind = typeof port === "string" ? "Pipe " + port : "Port " + port
		// Handle specific listen errors with friendly messages.
		switch (error.code) {
			case "EACCES":
				debug(bind + " requires elevated privileges")
				process.exit(1)
			case "EADDRINUSE":
				debug(bind + " is already in use")
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
