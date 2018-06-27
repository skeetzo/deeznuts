var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    _ = require('underscore'),
    // Gmail = require('../mods/gmail'),
    User = require('../models/user'),
    config = require('../config/index'),
    logger = config.logger;

const { check, validationResult } = require('express-validator/check');

// Local for Users
passport.use(new LocalStrategy({
    passReqToCallback: true,
  },
  function (req, username, password, callback) {
    User.findOne({'username':username}, function (err, user) {
      if (err) logger.warn(err);
      // Create if missing
      if (!user) { 
        // validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          var err = errors.array({ 'onlyFirstError': true })[0].msg;
          // if (err.indexOf('Cannot read property')>-1) err = 'Username format error!';
          req.flash('error', err);
          logger.warn('User signup not allowed: %s- %s', username, err);
          return next(null, false);
        }
        var ips = req.ips || [];
        ips.push(req.connection.remoteAddress);
        if (req.headers['x-forwarded-for'])
          ips.push(req.headers['x-forwarded-for']);
        User.findOne({'ip':{'$in':ips},'username':{'$eq':null}}, function (err, user_) {
          if (err) logger.warn(err);
          if (user_) {
            logger.log('User Associated: %s -> %s', ips, user_._id);
            user_.username = username;
            user_.password = password;
            return user_.save(function (err) {
              if (err) logger.warn(err);
              req.flash('message','Account created!');
              next(null, user_);
            });
          }
          logger.log('Creating new user: %s || %s', ips, username);
          user = new User({'username':username,'password':password,'ips':ips});
          user.logins++;
          user.save(function(err) {
            if (err) return logger.warn(err);
            req.flash('message','Account created!');
            return next(null, user);
          }); 
        });
        
        // Gmail.notifyNewAccount(function (err) {
        //   if (err) logger.warn(err);
        // });
      }
      else {
        logger.log('User found: %s', user.username);
        user.verifyPassword(password, function (err, isMatch) {
          if (err) logger.warn(err);
          if (isMatch) {
            user.logins++;
            user.save(function (err) {
              if (err) logger.warn(err);
              req.flash('message','Welcome back '+user.username+'!');
              return next(null, user);
            }); 
          }
          else {
            req.flash('error','Incorrect password!');
            logger.warn('Incorrect password: %s', username);
            return next(err); 
          }
        });
      }
    });
    function next(err, user) {
      if (err) {
        logger.warn(err);
        req.flash('error','There was an error!');
      }
      callback(err, user)
    }
}));

// Serialize
passport.serializeUser(function (user, callback) {
  callback(null, user._id);
});

// Deserialize
passport.deserializeUser(function (user, callback) {
  User.findById(user._id, function (err, user) { 
    callback(err, user); 
  });
});

module.exports = passport;