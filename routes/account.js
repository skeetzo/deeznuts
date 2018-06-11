var _ = require('underscore'),
    config = require('../config/index'),
    logger = config.logger,
    async = require('async'),
    mixins = require('../mods/mixins'),
    scraper = require('../mods/scraper'),
    fs = require('fs'),
    User = require('../models/user'),
    moment = require('moment');

var express = require('express');
var router = express.Router();


router.get("/account", mixins.resetLocals, mixins.loggedIn, function (req, res, next) {
	User.findById(req.session.user._id, function (err, user) {
		mixins.User_Account(user, function (err, user_) {
			req.session.locals.user = user_;
			req.session.locals.page = 'account';
			setDays(req);
			req.session.save(function (err) {
		  		if (err) logger.warn(err);
				res.render('account', req.session.locals);
		  	});
		});
	});
});

router.post("/account", mixins.loggedIn, function (req, res, next) {
	logger.log('Updating Settings: %s', req.session.user._id);
	async.waterfall([
		function (step) {
			User.findById(req.session.user._id, function (err, user) {
		  	    if (err) return step(err);
		  	    if (!user) {
		  	    	req.flash('error', 'There was an error!');
		  	    	return res.redirect('/');
		  	    }
		  	    step(null, user);
		  	});
		},
		function (user, step) {
			req.session.user = user;
			// logger.debug('%s: %s',req.session.user.username,JSON.stringify(req.body));
		    if (!req.body.submit) return res.redirect('/');
		   	else if (req.body.submit=='banner') return saveBannerPhoto(req, step);
		},
	], function (err) {
		if (err) {
			logger.warn(err);
			req.session.locals.error = 'There was an error!';
		}
		mixins.User_Account(req.session.user, function (err, user) {
			if (err) logger.warn(err);
			req.session.user = user;
			req.session.locals.user = user;
			req.session.locals.page = 'account';
			setDays(req);
			req.session.save(function (err) {
    			if (err) return step(err);
    			res.render('account', req.session.locals);
    		});
		}); 
	});
});


