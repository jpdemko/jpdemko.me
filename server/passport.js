const passport = require("passport")
const GoogleStrat = require("passport-google-oauth20").Strategy

const db = require("./db/db")

passport.serializeUser(function (user, done) {
	done(null, user.provider_id)
})

passport.deserializeUser(function (provider_id, done) {
	db.query(`SELECT * FROM users WHERE pid = $1`, [provider_id], function (selectErr, selectRes) {
		if (selectErr) {
			done(selectErr)
		} else {
			const user = selectRes.rows[0]
			delete user.id
			done(null, user)
		}
	})
})

passport.use(
	new GoogleStrat(
		{
			clientID: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
			callbackURL: "/auth/google/callback",
		},
		function (accessToken, refreshToken, profile, done) {
			const user = {
				provider_id: profile.id,
				email: profile.emails.find((e) => e.verified).value,
				name: profile.displayName,
			}
			db.query("SELECT * FROM users WHERE pid = $1", [user.provider_id], function (selectErr, selectRes) {
				if (selectErr) {
					return done(selectErr, user)
				}
				if (selectRes.rows.length < 1) {
					db.query(
						"INSERT INTO users(pid, email, uname) VALUES ($1, $2, $3)",
						[user.provider_id, user.email, user.name],
						function (insertErr, insertRes) {
							if (insertErr) {
								return done(insertErr, user)
							}
							done(null, user)
						}
					)
				} else {
					done(null, user)
				}
			})
		}
	)
)

module.exports = passport
