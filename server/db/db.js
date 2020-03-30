const { Pool } = require('pg')

const pool = new Pool()

pool.on('error', function(err, client) {
	console.error('pg pool error: ', err)
	process.exit(-1)
})

pool.query('SELECT * FROM pg_catalog.pg_tables', function(selectErr, selectRes) {
	console.log(Date.now())
	console.log(
		'@check db',
		selectRes.rows.filter((r) => r.schemaname === 'public').map((r) => r.tablename),
	)
})

console.log(`Checking PG credentials:`)
console.log(`PGHOST=${process.env.PGHOST}`)
console.log(`PGUSER=${process.env.PGUSER}`)
console.log(`PGDATABASE=${process.env.PGDATABASE}`)
console.log(`PGPASSWORD=${process.env.PGPASSWORD}`)
console.log(`PGPORT=${process.env.PGPORT}`)

module.exports = pool
