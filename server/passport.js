const passport = require("passport")
const GoogleStrat = require("passport-google-oauth20").Strategy
const GitHubStrat = require("passport-github2").Strategy

const queries = require("./db/queries")

passport.serializeUser(function (user, done) {
	done(null, user.pid)
})

passport.deserializeUser(async function (pid, done) {
	try {
		const res = await queries.users.getUserByPID(pid)
		done(null, res.rows[0])
	} catch (error) {
		console.error("passport deserializeUser() error: ", error)
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
				done(null, res.rows[0])
			} catch (error) {
				console.error("passport GoogleStrat error: ", error)
				done(error, user)
			}
		}
	)
)

passport.use(
	new GitHubStrat(
		{
			clientID: process.env.GITHUB_CLIENT_ID,
			clientSecret: process.env.GITHUB_CLIENT_SECRET,
			callbackURL: "/auth/github/callback",
		},
		async function (accessToken, refreshToken, profile, done) {
			console.log("passport github profile: ", profile)
			let user = {
				pid: profile.id,
				uname: profile.displayName,
				email: profile._json.email,
			}
			try {
				const res = await queries.users.upsertAll(user)
				done(null, res.rows[0])
			} catch (error) {
				console.error("passport GitHubStrat error: ", error)
				done(error, user)
			}
		}
	)
)

module.exports = passport
