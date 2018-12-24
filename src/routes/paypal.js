var _ = require('underscore'),
    config = require('../config/index'),
    logger = config.logger,
    async = require('async'),
    _ = require('underscore'),
    mixins = require('../modules/mixins');

module.exports = function homeRoutes(router) {

	// Subscription client request
	router.get("/paypal/approval", function (req, res, next) {
		logger.log('Processing PayPal Payment Request');
		logger.debug('PayPal GET query: %s', JSON.stringify(req.query, null, 4));
		async.waterfall([
			function (step) {
				var User = require('../models/user');
				User.findOne({'paypal_tokens':req.query.token}, function (err, user) {
					if (err) return step(err);
					if (!user) return step('Missing user: '+ user.username, 'You need to be a user to add time!');
					step(null, user);
				});
			},
			function (user, step) {
				var data = {
					'paymentId' : req.query.paymentId,
					'id' : req.query.PayerID,
					'total' : user.paypal_total,
					'_id':user._id
				};
				var PayPal = require('../modules/paypal');
				PayPal.executePayment(data, function (err, time) {
				    if (err) return step(err);
			        req.session.locals.message = 'You have added '+time+' seconds!';
					step(null, user);
				});
			},
			function (user, step) {
				for (var i=0;i<user.paypal_tokens.length;i++) 
		            if (user.paypal_tokens[i].toString()===req.query.token.toString()) 
		              user.paypal_tokens.splice(i,1);
		        user.paypal_total = null;
				user.save(function (err) {
					step(null);
				});
			}
			], function (err, text) {
				if (err) logger.warn(err);
				req.session.user = mixins.User(user);
				req.session.locals.user = mixins.User(user);
				req.session.locals.error = text || 'There was an error!';
			    res.redirect('/');
		});
	});

	// Subscription client request
	router.post("/paypal", mixins.loggedIn, function (req, res, next) {
		// if (!req.session.user) {
		// 	logger.warn('Missing logged in user.');
		// 	// return error('You need to login to subscribe!');
		// 	return res.status(400).send({'text':'You need to be a user to add time!'});
	 //    }
		async.waterfall([
			function (step) {	
				logger.log('Subscription Form (PayPal): %s', req.session.user._id);
				if (!config.PayPal) return step('PayPal Disabled', 'PayPal subscriptions are currently disabled!');
				logger.log('amount: %s', req.body.amount);
				var PayPal = require('../modules/paypal');
				if (req.body.amount=="5.00") { 
					PayPal.createPaymentSingle(req, function (err, url) {
						if (err) return step(err);
						logger.log('url: %s', url);
						step(null, url);
					});	
				}
				else if (req.body.amount=="10.00")
					PayPal.createPaymentDouble(req, function (err, url) {
						if (err) return step(err);
						step(null, url);
					});
				else if (req.body.amount=="20.00")
					PayPal.createPaymentTriple(req, function (err, url) {
						if (err) return step(err);
						step(null, url);
					});
			},
			function (url) {
				res.status(400).send({'url':url});
			}
			], function (err, text) {
				if (err) logger.warn(err);
				if (!text) text = 'There was an error!';
				res.status(400).send({'text':text});
		});
	});


	// Cancel
	router.get("/paypal/cancel", function (req, res) {
		res.redirect('/');
	});

	// Webhooks
	router.post("/paypal/hooks", function (req, res, next) {
		logger.log('hookQ: %s', JSON.stringify(req.query, null, 4));
		logger.log('hookB: %s', JSON.stringify(req.body, null, 4));
		mixins.verifyIP(req, function (err, source) {
			if (err) {
				logger.warn(err);
				return res.sendStatus(400);
			}
			var PayPal = require('../modules/paypal');
			PayPal.verifyWebhook(req, function (err) {
				if (err) {
					logger.warn('Error verifying PayPal Webhook');
					return res.sendStatus(400);
				}
				PayPal.handleWebhook(req.body.event_type, req.body);
				return res.sendStatus(200);
			});	
		})
	});

}