var config = require('../config/index'),
    logger = config.logger,
    passport = require('passports'),
    mixins = require('../modules/mixins');

module.exports = function homeRoutes(router) {

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
}

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