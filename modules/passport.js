var passport = require('passport'),
    TwitterStrategy = require('passport-twitter').Strategy,
    LocalStrategy = require('passport-local').Strategy,
    _ = require('underscore'),
    Gmail = require('../mods/gmail'),
    User = require('../models/user'),
    Fan = require('../models/fan'),
    Performer = require('../models/performer'),
    config = require('../config/index'),
    logger = config.logger;

const { check, validationResult } = require('express-validator/check');

// Local for Fans
passport.use(new LocalStrategy({
    passReqToCallback: true,
  },
  function (req, username, password, callback) {
    Fan.findOne({'username':username}, function (err, fan) {
      if (err) logger.warn(err);
      // Create if missing
      if (!fan) { 
        // validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          var err = errors.array({ 'onlyFirstError': true })[0].msg;
          // if (err.indexOf('Cannot read property')>-1) err = 'Username format error!';
          req.flash('error', err);
          logger.warn('User signup not allowed: %s- %s', username, err);
          return next(null, false);
        }

        logger.log('Creating new fan: %s', username);
        fan = new Fan({'username':username,'password':password});
        fan.logins++;
        fan.save(function(err) {
          if (err) return logger.warn(err);
          req.flash('message','Account created! Verify your email to begin subscribing!');
          return next(null, fan);
        }); 
        Gmail.notifyNewAccount(function (err) {
          if (err) logger.warn(err);
        });
      }
      else {
        logger.log('Fan found: %s', fan.username);
        fan.verifyPassword(password, function (err, isMatch) {
          if (err) logger.warn(err);
          if (isMatch) {
            fan.logins++;
            fan.save(function (err) {
              if (err) logger.warn(err);
              req.flash('message','Welcome back '+fan.username+'!');
              return next(null, fan);
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

// Twitter for Performers
passport.use(new TwitterStrategy({
    consumerKey: config.Twitter_consumer_key,
    consumerSecret: config.Twitter_consumer_secret,
    callbackURL: config.domain+"/auth/twitter/callback",
    passReqToCallback: true,
    display: 'popup',
  },
  function (req, accessToken, refreshToken, profile, callback) {
    // logger.debug('profile: %s',JSON.stringify(profile,null,4));
    logger.log('Performer authenticating via Twitter: %s', profile.displayName);
    Performer.findOne({'username':profile.username}, function (err, performer) {
      if (err) {
        logger.warn(err);
        req.session.locals.error = 'Error logging in!';
        next(null, null);
      }
      var profile_ = {
        username: profile.username,
        displayName: profile.displayName,
        description: profile._json.description,
        profileImage: profile._json.profile_image_url,
        bannerImage: profile._json.profile_banner_url,
        accessToken: accessToken,
        refreshToken: refreshToken,
      };
      if (!performer) { 
        // Twitter Performer check
        if (_.indexOf(config.performers_twitters, profile.username.toLowerCase())<0) {
          logger.warn('Twitter User Denied: %s', profile.username);
          req.session.locals.error = 'Login denied! Contact Alex D.'
          // req.flash('error', 'Login denied! Contact Alex D.');
          req.session.flashSkip = 2;
          return next(null, false);
        }
        logger.log('Creating new performer: %s', profile.username);
        // req.flash('message','Account created! Add your email and snapchat!');
        req.session.locals.message = 'Account created! Add your email and snapchat!';
        req.session.flashSkip = 3;
        performer = new Performer({'username':profile_.username,'name':profile_.displayName,'twitter':profile_,'bio':profile_.description});
        performer.save(function (err) {
          next(err, performer);
        });
        // follows the performer with the main social media account for kairosnaps
        // to-do; add Twitter mod
        // Twitter.followPerformer(profile);
        // to-do; add option to tweet new account availability
        // to-do; add tooltips to buttons
      }
      else {
        logger.log('performer found: %s', performer.username);
        req.session.locals.message = 'Welcome back '+profile.displayName+'!';
        req.session.flashSkip = 3;
        performer.twitter = profile_;
        performer.logins++;
        performer.save(function (err) {
            next(err, performer);
        });
      }
    });
    function next(err, user) {
      if (err) logger.warn(err);
      req.session.save(function (err_) {
        if (err) logger.warn(err_);
        callback(null, user);
      });
    }
  }
));

// Serialize
passport.serializeUser(function (user, callback) {
  callback(null, user.id);
});

// Deserialize
passport.deserializeUser(function (user, callback) {
  User.findById(user.id, function (err, user) { 
    callback(err, user); 
  });
});

module.exports = passport;