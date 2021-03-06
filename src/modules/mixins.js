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
    if (config.debugging_live) return next(null);
    if (req.session.user&&(parseInt(req.session.user.time)>=1&&config.live_status=='Live')) {
        next(null);
    } 
    else if (config.live_status!='Live') {
        req.flash('error','Please wait until I am live!');
        res.redirect('/');
    }
    else {
        req.flash('error','Please pay up!');
        res.redirect('/');
    }
}

module.exports.hasRoom = function(req, res, next) {
    var isRoom = require('../modules/socket.io').isRoom();
    if (isRoom) return next(null);
    req.session.locals.error = 'There\'s not enough room for you!';
    res.status(400).render('index', req.session.locals);
}

// Check Login
module.exports.loggedIn = function(req, res, next) {
    if (req.session.user) {
        User.findById(req.session.user._id, function (err, user) {
            if (err) {
                logger.warn(err);
                req.session.locals.error = 'There was an error!';
                res.status(401).render('index', req.session.locals);
            }
            req.session.user = User_(user);
            req.session.locals.user = User_(user);
            next(null);
        });
    }
    else {
        req.session.locals.error = 'Please login!';
        res.status(401).render('index', req.session.locals);
    }
}

module.exports.loggedInDeezNuts = function(req, res, next) {
    if (!req.session.user) {
        req.session.locals.error = 'Please login!';
        return res.status(401).render('index', req.session.locals);
    }
    User.findOne({'_id':req.session.user._id,'username':config.deeznutsUser.username}, function (err, user) {
        if (err) {
            logger.warn(err);
            req.session.locals.error = 'Ha!';
            return res.status(401).render('index', req.session.locals); 
        }
        next(null);
    });
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

    req.session.locals.status = config.live_status;

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

    // if (!req.session.locals._csrf)
    req.session.locals._csrf = req.csrfToken();

    // rtmp key
    var timestamp = (Date.now() + config.streamKeyExpire);
    var hash = md5("/live/stream-"+timestamp+"-"+config.streamKey);
    req.session.locals.key = timestamp+"-"+hash;

    req.session.save(function (err) {
        if (err) logger.warn(err);
        // logger.debug('locals updated');
        next(null);
    });
}

module.exports.syncUser = function (req, res, next) {
    if (!req.session.user) return next();
    // logger.debug('Syncing User: %s', req.session.user._id);
    User.findById(req.session.user._id, function (err, user) {
        if (err) {
            logger.warn(err);
            return next();
        }
        req.session.user = User_(user);
        req.session.locals.user = User_(user);
        req.session.save(function (err) {
            if (err) logger.warn(err);
            next();
        });
    });
}

var User_ = function(src) {
  var user = {
    '_id': src._id,
    'address': src.address,
    'address_qr': src.address_qr,
    'time': src.time,
    'videos': src.videos
  };
  return user;
}
module.exports.User = User_;

var Video = function(src) {
  if (!src.path) src.path = '';
  if (!src.path_image) src.path_image = '';
  var path_ = path.join(config.videosPath, src.path).replace(/.*videos\//gi, '');
  var path_image = path.join(config.imagesPath, src.path_image).replace(/.*images\//gi, '../images/');
  // logger.log('path: %s', path_);
  // logger.log('path_image: %s', path_image);
  return {
    '_id': src._id,
    'title': src.title,
    'date': src.date,
    'performers': src.performers,
    'description': src.description,
    'path': path_ || '',
    'path_image': path_image || '',
    'price': src.price
  };
}
module.exports.Video = Video;

var Video_Preview = function(src) {
  if (!src.path_preview) src.path_preview = '';
  if (!src.path_image) src.path_image = '';
  // var path_ = src.path_preview.replace('/mnt/deeznuts', '..');
  // var path_image = src.path_image.replace('/mnt/deeznuts', '..');
  var path_ = path.join(config.videosPath, src.path_preview).replace(/.*videos\//gi, '');
  var path_image = path.join(config.imagesPath, src.path_image).replace(/.*images\//gi, '../images/');
  // logger.log('path: %s', path_);
  // logger.log('path_image: %s', path_image);
  return {
    '_id': src._id,
    'title': src.title,
    'date': src.date,
    'performers': src.performers,
    'description': src.description,
    'path': path_ || '',
    'path_image': path_image || '',
    'price': src.price
  };
}
module.exports.Video_Preview = Video_Preview;

var Videos = function(src) {
  var videos = [];
  for (var i=0;i<src.length;i++)
    videos.push(Video(src[i]));
  return videos;
}
module.exports.Videos = Videos;

var Video_Previews = function(src) {
  var videos = [];
  for (var i=0;i<src.length;i++)
    videos.push(Video_Preview(src[i]));
  return videos;
}
module.exports.Video_Previews = Video_Previews;
