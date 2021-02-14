const { Pool } = require("pg")

const isProd = process.env.NODE_ENV === "production"
const isHerokuLocal = process.env.HEROKU_LOCAL

const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`

const pool = new Pool({
	connectionString: isHerokuLocal || !isProd ? connectionString : process.env.DATABASE_URL,
	ssl: isProd && !isHerokuLocal,
})

pool.on("error", function (err, client) {
	console.error("pg pool error: ", err)
	process.exit(-1)
})

module.exports = pool
