var passport = require('passport'),
    config = require('../config/index.js'),
    logger = config.logger,
    _ = require('underscore'),
    mixins = require('../mods/mixins');

var RateLimit = require('express-rate-limit');
const { check, validationResult } = require('express-validator/check');

var signUpLimiter = new RateLimit({
  windowMs: 60*60*1000, // 1 hour window
  delayAfter: 1, // begin slowing down responses after the first request
  delayMs: 3*1000, // slow down subsequent responses by 3 seconds per request
  max: 5, // start blocking after 5 requests
  message: "Too many logins from this IP, please try again after an hour. Go jerk off or something."
});

// Local
router.post("/login", signUpLimiter, [
	check('username')
    	.trim()
		.isLength({ 'min': 3, 'max': 15 }).withMessage('Username must be 3-15 characters!')
	    .custom(value => {
	    	return checkUsername(value);
	    }),
	check('password')
		.trim()
		.isLength({ 'min': 6 }).withMessage('Password must be at least 6 characters!')
		.matches(/\d/).withMessage('Password must contain at least 1 number!')
	], passport.authenticate('local', 
	{ 
		failureRedirect: '/',
 	}),
  	function (req, res) {
		req.session.locals.loggedIn = 'fan';
		req.session.user = mixins.User(req.user);
		req.session.user.logins++;
			logger.log('login successful (local): %s', req.user._id);
		req.session.save(function(err) {
  			if (err) logger.warn(err);
	    	res.redirect('/all');
  		});
	}
);

// Twitter
router.get('/auth/twitter', signUpLimiter, passport.authenticate('twitter'));
// Callback
router.get('/auth/twitter/callback', passport.authenticate('twitter', 
	{ 
		failureRedirect: '/authenticated',
	}),
	function (req, res) {
    	req.session.locals.loggedIn = 'performer';
    	req.session.user = mixins.User(req.user);
		req.session.user.logins++;
    	req.session.save(function(err) {
  			if (err) logger.warn(err);
  			logger.log('login successful (twitter): %s',req.user._id);
	    	res.redirect('/authenticated');
  		});
	}
);

// Logout
router.get('/logout', mixins.loggedIn, function (req, res) {
	var name = req.session.user._id;
	logger.log('logging out: %s', name);
    req.logout();
	req.session.locals.loggedIn = false;
	req.flash('message',"Logout successful!");
	req.session.locals.user = null;
	req.session.user = null;
		req.session.save(function(err) {
			if (err) logger.warn(err);
			logger.log('logout successful: %s', name);
    	res.redirect('/');
		});
});
