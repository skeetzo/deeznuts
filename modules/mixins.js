var _ = require('underscore'),
    config = require('../config/index'),
    moment = require('moment'),
    logger = config.logger,
    async = require('async'),
    path = require('path'),
    md5 = require('md5'),
    Viewer = require('../models/viewer');

module.exports.findViewer = function(req, res, next) {
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    Viewer.findOne({'ip':ip}, function (err, viewer) {
        if (err) logger.warn(err);
        if (!viewer) {
            req.session.viewer = new Viewer({'ip':ip});
            logger.log('Viewer created: %s', ip);
            step();
        }
        else {
            logger.log('Viewer found: %s', ip);
            viewer.lastVisit = moment(new Date()).format('MM/DD/YYYY');
            // viewer.visits++;
            req.session.viewer = viewer;
            step();
        }
    });

    function step() {
        req.session.viewer.save(function (err) {
            if (err) logger.warn(err);
            req.session.locals.viewer = Viewer_(req.session.viewer);
            next(null);
        });
    }
}

// Has Paid
module.exports.hasPaid = function(req, res, next) {
    if ((parseInt(req.session.viewer.time)>=1&&config.status=='Live')||config.debugging_live) {
        next();
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

    // rtmp auth
    var timestamp = (Date.now() + 3600000);
    var hash = md5("/live/stream-"+timestamp+"-"+config.streamKey);
    req.session.locals.key = timestamp+"-"+hash;
    
    req.session.save(function (err) {
        if (err) logger.warn(err);
        // logger.debug('locals updated');
        next(null);
    });
}

var Viewer_ = function(src) {
  return {
    'address': 'bitcoin:'+src.address,
    'address_qr': src.address_qr,
    'ip': src.ip,
    'time': src.time
  };
}
module.exports.Viewer = Viewer;