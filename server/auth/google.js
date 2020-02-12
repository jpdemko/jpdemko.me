const passport = require('passport')
const GoogleStrat = require('passport-google-oauth')

passport.use(
	new GoogleStrat({
		clientID: process.env.REACT_APP_GOOGLE_CLIENT_ID,
		clientSecret: process.env.REACT_APP_GOOGLE_CLIENT_SECRET,
		callbackURL: `${process.env.REACT_APP_HOME_URL}auth/google/callback`,
	}),
	function(accessToken, refreshToken, profile, done) {},
)

module.exports = passport
