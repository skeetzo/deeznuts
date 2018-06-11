var express = require('express');
var router = express.Router();
var _ = require('underscore'),
    config = require('../config/index.js'),
    logger = config.logger,
    async = require('async'),
    _ = require('underscore'),
    mixins = require('../mods/mixins'),
    Performer = require('../models/performer.js');


router.use(function (req, res, next) {
	// logger.debug(req);
	var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    logger.log("%s: /%s %s",ip, req.method, req.url);
	next(null);
});

// Index
router.get("/", mixins.resetLocals, function (req, res, next) {
    if (_.contains(config.pages,req.url.replace('/','')))
		return render(req.url);
	// if logged in
	if (req.session.user)
		return res.redirect('/all');
	return render('index');
    function render(page) {
      req.session.locals.page = page;
      req.session.save(function (err) {
      	if (err) logger.warn(err);
    	res.render(page, req.session.locals);
      });
    }
});

// Performer
router.get("/:performer", mixins.resetLocals, function (req, res, next) {
	// logger.log('performer route');
	if (req.url=='/robots.txt') return goTo('all');
	if (_.contains(config.pages,req.url.replace('/','')))
		return goTo(req.url.replace('/',''));
	if (~req.params.performer.indexOf('favicon.ico')) {
		logger.warn('why the fuck is this happening');
		return goTo('all');
	}
	// Reset Password
	if (req.params.performer == 'reset'&&req.session.user) {
		logger.log('resetting password: %s', req.session.user._id);
		return res.render('reset', req.session.locals);
     }

	if (!req.params.performer)
		req.params.performer = 'all';

	// all
	if (req.params.performer=='all')
		Performer.find({'snapchat': {'$gt': 0, '$not': {'$eq': ''}}, 'emailVerified': true}, function (err, performers) {
			if (err) logger.warn(err);
			// Subscription text
			_.forEach(performers, function (performer) {
				performer = displayText(req.session.locals.user, performer);
			});
			req.session.locals.performers = mixins.Performers(performers);
			return goTo('all');
		});
	// performer profile
	else
		Performer.findOne({'snapchat':req.params.performer}, function (err, performer) {
			if (err) logger.warn(err);
			if (!performer) { // no performers found by that snapchat
				logger.log('No Performer found: %s',req.params.performer);
				req.flash('error','No Performer by that Snapchat!');
				return goTo('all');
			}
			performer = displayText(req.session.locals.user, performer);
			performer.snapchatDisplay = performer.snapchat;
			req.session.locals.performer = mixins.Performer(performer);
			return goTo('profile');
		});
	
	function goTo(page) {
		// logger.debug('page: %s', page);
		req.session.locals.page = page;
		req.session.save(function (err) {
	  		if (err) logger.warn(err);
		 	res.render(page, req.session.locals);
		});		
	}
});


