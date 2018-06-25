var express = require('express'),
    router = express.Router(),
    config = require('../config/index'),
    logger = config.logger,
    async = require('async'),
    _ = require('underscore'),
    passport = require('passport'),
    mixins = require('../modules/mixins'),
    User = require('../models/user');

// /
router.use(mixins.resetLocals, mixins.findUser, function (req, res, next) {
	var ips = req.ips || [];
  ips.push(req.connection.remoteAddress);
  if (req.headers['x-forwarded-for'])
    ips.push(req.headers['x-forwarded-for']);
  logger.log("%s /%s %s", ips, req.method, req.url);
	next(null);
});

// /index
router.get("/", function (req, res, next) {
  res.render('index', req.session.locals);
});

// /live
router.get("/live", mixins.loggedIn, mixins.hasPaid, function (req, res, next) {
  if (config.streamKeyCurrent)
    req.session.locals.key = config.streamKeyCurrent;
  res.render('live', req.session.locals);    
});

// blockchainCallback
router.get(config.blockchainRoute, function (req, res, next) {
  logger.debug('req.query: %s', JSON.stringify(req.query, null, 4));
  User.addTransaction(req.query, function (err) {
    if (err) logger.warn(err);
    res.send("*ok*");
  });
});

router.get("/address", mixins.loggedIn, function (req, res, next) {
  User.generateAddress(req.session.user, function (err) {
    if (err) {
      logger.warn(err);
      return res.sendStatus(404);
    }
    res.sendStatus(200);
  });
});

// check for recent tips
router.post("/sync", function (req, res, next) {
  // logger.debug('req.session.user: %s', JSON.stringify(req.session.user, null, 4));
  req.body._id = req.session.locals.user._id;
  User.sync(req.body, function (err, synced) {
    if (err) {
      logger.warn(err);
      return res.sendStatus(404);
    }
    res.status(200).send(synced);
  });
});

// router.get("/add", mixins.loggedIn,  function (req, res, next) {
//   User.findOne({'ip':req.session.user.ip}, function (err, user) {
//     if (err) logger.warn(err);
//     if (!user) return res.sendStatus(404);
//     // user.time_added = 60;
//     var oneDollarInBTC = 0.00015;
//     user.addTime(100000000*oneDollarInBTC*6);
//   });
// });

router.get("/key", mixins.loggedInAlexD, function (req, res, next) {
  res.render('key', req.session.locals);
});

router.post("/key", function (req, res, next) {
  var phrase = req.body.phrase;
  if (phrase!='banana') return res.sendStatus(401);
  var timestamp =(Date.now() + 3600000);
  var hash = require('md5')("/live/stream-"+timestamp+"-"+config.streamKey);
  res.status(200).send({'key':timestamp+"-"+hash});
});

router.get("/terms", function (req, res, next) {
  res.render('terms', req.session.locals);
});

router.get("/support", function (req, res, next) {
  res.render('support', req.session.locals);
});

router.get("/privacy", function (req, res, next) {
  res.render('privacy', req.session.locals);
});

// Auth

var RateLimit = require('express-rate-limit');
const { check, validationResult } = require('express-validator/check');

var maxRate = 5;
if (config.debugging) maxRate = 50;

var signUpLimiter = new RateLimit({
  windowMs: 60*60*1000, // 1 hour window
  delayAfter: 1, // begin slowing down responses after the first request
  delayMs: 3*1000, // slow down subsequent responses by 3 seconds per request
  max: maxRate, // start blocking after 5 requests
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
    req.session.user = mixins.User(req.user);
    req.session.user.logins++;
    req.session.locals.loggedIn = true;
    req.session.locals.user = mixins.User(req.session.user);
    logger.log('login successful (local): %s', req.user._id);
    req.session.save(function(err) {
      if (err) logger.warn(err);
      res.redirect('/');
    });
  }
);

// Logout
router.get('/logout', mixins.loggedIn, function (req, res) {
  var name = req.session.user._id;
    logger.log('logging out: %s', name);
    req.logout();
    req.flash('message',"Logout successful!");
    req.session.locals.loggedIn = false;
    req.session.locals.user = null;
    req.session.user = null;
    req.session.save(function(err) {
      if (err) logger.warn(err);
      logger.log('logout successful: %s', name);
      res.redirect('/');
    });
});


// Username Validations
function checkUsername(value) {
  // no spaces
  if (value.indexOf(' ')>-1) throw new Error('Username cannot contain spaces!');
  // cant start with a number
  else if (parseInt(value.charAt(0))>0) throw new Error('Username cannot start with a number!');
  // cant start with a hyphen
  else if (value.charAt(0)=='-') throw new Error('Username cannot start with a hyphen!');
  // cant start with an underscore
  else if (value.charAt(0)=='_') throw new Error('Username cannot start with an underscore!');
  // cant start with a period
  else if (value.charAt(0)=='.') throw new Error('Username cannot start with a period!');
  // must begin with a letter
  else if (parseInt(value.charAt(0))>=0) throw new Error('Username must begin with a letter!');
  // cant end with a hypen
  else if (value.charAt(value.length-1)=='-') throw new Error('Username cannot end with a hyphen!');
  // cant end with an underscore
  else if (value.charAt(value.length-1)=='_') throw new Error('Username cannot end with an underscore!');
  // cant end with a period
  else if (value.charAt(value.length-1)=='.') throw new Error('Username cannot end with a period!');
  // other symbols
  else if (value.indexOf('!')>-1) throw new Error('Username cannot contain symbols!');
  else if (value.indexOf('@')>-1) throw new Error('Username cannot contain symbols!');
  else if (value.indexOf('#')>-1) throw new Error('Username cannot contain symbols!');
  else if (value.indexOf('$')>-1) throw new Error('Username cannot contain symbols!');
  else if (value.indexOf('%')>-1) throw new Error('Username cannot contain symbols!');
  else if (value.indexOf('^')>-1) throw new Error('Username cannot contain symbols!');
  else if (value.indexOf('&')>-1) throw new Error('Username cannot contain symbols!');
  else if (value.indexOf('*')>-1) throw new Error('Username cannot contain symbols!');
  else if (value.indexOf('(')>-1) throw new Error('Username cannot contain symbols!');
  else if (value.indexOf(')')>-1) throw new Error('Username cannot contain symbols!');
  else if (value.indexOf('=')>-1) throw new Error('Username cannot contain symbols!');
  else if (value.indexOf('+')>-1) throw new Error('Username cannot contain symbols!');
  else if (value.indexOf('{')>-1) throw new Error('Username cannot contain symbols!');
  else if (value.indexOf('}')>-1) throw new Error('Username cannot contain symbols!');
  else if (value.indexOf('[')>-1) throw new Error('Username cannot contain symbols!');
  else if (value.indexOf(']')>-1) throw new Error('Username cannot contain symbols!');
  else if (value.indexOf('\'')>-1) throw new Error('Username cannot contain symbols!');
  else if (value.indexOf('\"')>-1) throw new Error('Username cannot contain symbols!');
  else if (value.indexOf('?')>-1) throw new Error('Username cannot contain symbols!');
  else if (value.indexOf('<')>-1) throw new Error('Username cannot contain symbols!');
  else if (value.indexOf('>')>-1) throw new Error('Username cannot contain symbols!');
  else if (value.indexOf(',')>-1) throw new Error('Username cannot contain symbols!');
  return true;
}

module.exports = router;