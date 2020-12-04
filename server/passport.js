const passport = require("passport")
const GoogleStrat = require("passport-google-oauth20").Strategy

const queries = require("./db/queries")

passport.serializeUser(function (user, done) {
	console.log("passport serializeUser() user: ", user)
	done(null, user.pid)
})

passport.deserializeUser(async function (pid, done) {
	try {
		const res = await queries.users.getUserByPID(pid)
		done(null, res.rows[0])
	} catch (error) {
		console.log("passport deserialize() error: ", error)
		done(error)
	}
})

passport.use(
	new GoogleStrat(
		{
			clientID: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
			callbackURL: "/auth/google/callback",
		},
		async function (accessToken, refreshToken, profile, done) {
			let user = {
				pid: profile.id,
				email: profile.emails.find((e) => e.verified).value,
				uname: profile.displayName,
			}
			try {
				const res = await queries.users.upsertAll(user)
				console.log("GoogleStrat init res: ", res.rows)
				done(null, res.rows[0])
			} catch (error) {
				console.log("GoogleStrat error: ", error)
				done(error, user)
			}
		}
	)
)

module.exports = passport
