const express = require('express')
const router = express.Router()
const passport = require('../passport')

function checkAuth(req, res, next) {
	console.log(`checkAuth() authenticated: ${req.isAuthenticated()}`)
	if (req.isAuthenticated()) return next()
	res.json({ error: 'User is not authenticated.' })
}

router.get('/user', checkAuth, function(req, res) {
	console.log('get user/ success, user is: ', req.user)
	res.json(req.user)
})

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }))

router.get(
	'/google/callback',
	passport.authenticate('google', {
		failureRedirect: '/#/login_error',
		successRedirect: '/#/',
	}),
)

module.exports = router
