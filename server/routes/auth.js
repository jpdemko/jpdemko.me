const express = require('express')
const router = express.Router()
const passportGoogle = require('../auth/google')

router.get(
	'/auth/google',
	passportGoogle.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login'] }),
)

app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), function(
	req,
	res,
) {
	res.redirect('/')
})

module.exports = router
