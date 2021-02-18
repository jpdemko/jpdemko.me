const { Pool } = require("pg")

const isProd = process.env.NODE_ENV === "production"

const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`

const pool = new Pool({
	connectionString: isProd ? process.env.DATABASE_URL : connectionString,
	ssl: {
		rejectUnauthorized: false,
	},
})

pool.on("error", function (err, client) {
	console.error("pg pool error: ", err)
	process.exit(-1)
})

module.exports = pool
