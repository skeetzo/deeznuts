var _ = require('underscore'),
    config = require('../config/index'),
    moment = require('moment'),
    logger = config.logger,
    async = require('async'),
    path = require('path'),
    md5 = require('md5'),
    User = require('../models/user');

// Has Paid
module.exports.hasPaid = function(req, res, next) {
    if ((parseInt(req.session.user.time)>=1&&config.status=='Live')||config.debugging_live) {
        next(null);
    } 
    else if (config.status!='Live') {
        req.flash('error','Please wait until I am live!');
        res.redirect('/');
    }
    else {
        req.flash('error','Please pay up!');
        res.redirect('/');
    }
}

// Check Login
module.exports.loggedIn = function(req, res, next) {
    if (req.session.user&&req.session.locals.loggedIn)
        next(null);
    else {
        req.session.locals.error = 'Please login!';
        res.status(401).render('index', req.session.locals);
    }
}

module.exports.loggedInAlexD = function(req, res, next) {
    if (req.session.user&&req.session.locals.loggedIn&&req.session.user.username==config.alexd.username)
        next(null);
    else {
        req.session.locals.error = 'Ha!';
        res.status(401).render('index', req.session.locals);
    }
}

// Reset Locals
module.exports.resetLocals = function(req, res, next) {
	// App Locals
	if (!req.session.locals) {
    	// logger.debug('resetting session locals');
    	req.session.locals = {};
    	_.forEach(_.keys(req.app.locals), function(setting) {
		    req.session.locals[setting] = req.app.locals[setting];
		});
    }
   	// Local Settings
    // this can be cut out or set to only run once
    _.forEach(_.keys(config.pageData), function(setting) {
	    if (!req.session.locals[setting])
		    req.session.locals[setting] = config.pageData[setting];
	});

    req.session.locals.status = config.status;

    // Flash Messages
    if (!req.session.flashSkip) req.session.flashSkip = -1;
    // else logger.log('flashSkip: %s', req.session.flashSkip);
    // Flash check from Passport Logins
    if (req.session.flashSkip>=0)
        req.session.flashSkip--;
    else {
        var tmp = req.flash('message');
        if (tmp.length>0) req.session.locals.message = tmp;
        else req.session.locals.message = null;
        tmp = req.flash('error');
        if (tmp.length>0) req.session.locals.error = tmp;
        else req.session.locals.error = null;
        // logger.debug('message: %s',req.session.locals.message);
        // logger.debug('error: %s',req.session.locals.error);
    }

    if (!req.session.locals._csrf)
        req.session.locals._csrf = req.csrfToken();

    // rtmp key
    if (!req.session.locals.key) {
        var timestamp = (Date.now() + config.streamKeyExpire);
        var hash = md5("/live/stream-"+timestamp+"-"+config.streamKey);
        req.session.locals.key = timestamp+"-"+hash;
    }

    req.session.save(function (err) {
        if (err) logger.warn(err);
        // logger.debug('locals updated');
        next(null);
    });
}

module.exports.syncUser = function (req, res, next) {
    if (!req.session.user) return next();
    User.findById(req.session.user._id, function (err, user) {
        if (err) {
            logger.warn(err);
            return next();
        }
        req.session.user = User_(user);
        req.session.save(function (err) {
            if (err) logger.warn(err);
            next();
        }
    })
}

var User_ = function(src) {
  return {
    '_id': src._id,
    'address': src.address,
    'address_qr': src.address_qr,
    'time': src.time
  };
}
module.exports.User = User_;