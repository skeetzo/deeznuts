var _ = require('underscore'),
    config = require('../config/index'),
    moment = require('moment'),
    logger = config.logger,
    async = require('async'),
    // Money = require('es-money'),
    path = require('path'),
    Viewer = require('../models/viewer');

// Has Paid
module.exports.hasPaid = function(req, res, next) {
    if (req.session.paid||config.debugging) {
        next();
    } else {
        req.flash('error','Please pay up!');
        res.redirect('/');
        // res.status(401).render('index', req.session.locals);
    }
}

module.exports.findViewer = function(req, res, next) {
    if (req.session.viewer) return next(null);
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    Viewer.findOne({'ip':ip}, function (err, viewer) {
        if (err) logger.warn(err);
        if (!viewer) {
            req.session.viewer = new Viewer({'ip':ip});
            step();
        }
        else {
            viewer.lastVisit = moment(new Date()).format('MM/DD/YYYY');
            viewer.visits++;
            req.session.viewer = viewer;
            step();
        }
    });

    function step() {
        req.session.viewer.save(function (err) {
            if (err) logger.warn(err);
            next(null);
        });
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
    
    req.session.save(function (err) {
        if (err) logger.warn(err);
        // logger.debug('locals updated');
        next(null);
    });
}
