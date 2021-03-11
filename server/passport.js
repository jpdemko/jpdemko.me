const GoogleStrat = require("passport-google-oauth20").Strategy
const GitHubStrat = require("passport-github2").Strategy
const debug = require("debug")("server:passport")

module.exports = function (passport) {
	const queries = require("./db/queries")

	passport.serializeUser(function (user, done) {
		debug("passport serializeUser(): ", user)
		done(null, user.pid)
	})

	passport.deserializeUser(async function (pid, done) {
		try {
			const res = await queries.users.getUserByPID(pid)
			const user = res.rows[0]
			debug("passport.deserializeUser(): ", user)
			done(null, user)
		} catch (error) {
			debug("passport.deserializeUser() error: ", error)
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
					debug("passport Google user upsert return: ", res.rows[0])
					done(null, res.rows[0])
				} catch (error) {
					debug("passport GoogleStrat error: ", error)
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
				let user = {
					pid: profile.id,
					uname: profile.displayName,
					email: profile._json.email,
				}
				try {
					const res = await queries.users.upsertAll(user)
					debug("passport GitHub user upsert return: ", res.rows[0])
					done(null, res.rows[0])
				} catch (error) {
					debug("passport GitHubStrat error: ", error)
					done(error, user)
				}
			}
		)
	)
}
