var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    _ = require('underscore'),
    // Gmail = require('../mods/gmail'),
    Viewer = require('../models/viewer'),
    config = require('../config/index'),
    logger = config.logger;

const { check, validationResult } = require('express-validator/check');

// Local for Viewers
passport.use(new LocalStrategy({
    passReqToCallback: true,
  },
  function (req, username, password, callback) {
    Viewer.findOne({'username':username}, function (err, viewer) {
      if (err) logger.warn(err);
      // Create if missing
      if (!viewer) { 
        // validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          var err = errors.array({ 'onlyFirstError': true })[0].msg;
          // if (err.indexOf('Cannot read property')>-1) err = 'Viewername format error!';
          req.flash('error', err);
          logger.warn('Viewer signup not allowed: %s- %s', username, err);
          return next(null, false);
        }

        logger.log('Creating new viewer: %s', username);
        viewer = new Viewer({'username':username,'password':password});
        viewer.logins++;
        viewer.save(function(err) {
          if (err) return logger.warn(err);
          req.flash('message','Account created!');
          return next(null, viewer);
        }); 
        // Gmail.notifyNewAccount(function (err) {
        //   if (err) logger.warn(err);
        // });
      }
      else {
        logger.log('Viewer found: %s', viewer.username);
        viewer.verifyPassword(password, function (err, isMatch) {
          if (err) logger.warn(err);
          if (isMatch) {
            viewer.logins++;
            viewer.save(function (err) {
              if (err) logger.warn(err);
              req.flash('message','Welcome back '+viewer.username+'!');
              return next(null, viewer);
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
    function next(err, viewer) {
      if (err) {
        logger.warn(err);
        req.flash('error','There was an error!');
      }
      callback(err, viewer)
    }
}));

// Serialize
passport.serializeUser(function (viewer, callback) {
  callback(null, viewer.id);
});

// Deserialize
passport.deserializeUser(function (viewer, callback) {
  Viewer.findById(viewer.id, function (err, viewer) { 
    callback(err, viewer); 
  });
});

module.exports = passport;