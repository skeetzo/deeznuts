var config = require('../config/index'),
	logger = config.logger,
	async = require('async'),
	_ = require('underscore'),
    Plan = require('../models/plan'),
 	PayPal = require('paypal-rest-sdk'),
 	moment = require('moment'),
    Money = require('es-money');

// PayPal SDK
PayPal.configure(config.paypal_creds);

////////////

// Subscriptions Functions

var executePayment = function(data, callback) {
	var paymentId = data.paymentId,
		id = data.id,
		total = data.total;
	if (!paymentId) return callback('Error Executing Payment: Missing Payment Id!');
	if (!id) return callback('Error Executing Payment: Missing Id!');
	if (!total) return callback('Error Executing Payment: Missing Total!');
	logger.log('Executing PayPal Payment: %s', paymentId);
	async.waterfall([
		function (step) {
			var User = require('../models/user');
			User.findById(data._id, function (err, user) {
				if (err) {
			        logger.warn(err);
			        return step('There was an error.');
			    }
			    if (!user) {
			        logger.warn('No user found!');
			        return step('There was an error.');
			    }
			    step(null, user);
			})
		},
		function (user, step) {
			var execute_payment_json = generatePaymentExecuteJSON(id, total);
			paypal.payment.execute(paymentId, execute_payment_json, function (err, payment) {
			    if (err) {
			        logger.warn(err);
			        return step('There was an error.');
			    }
		        logger.log('PayPal Payment execution success!');
		        step(null, user);
			});
		},
		function (user, step) {
			user.addTime(data.total, function (err) {
				if (err) logger.warn(err);
				else logger.log('PayPal Payment Success!');
				callback(null);
			});
		}
	], function (err) {
		callback(err);
	});
}
module.exports.executePayment = executePayment;

// var activateSubscription = function(data, callback) {
	// logger.log('Activating PayPal Billing Agreement');
	// logger.debug('data: %s', JSON.stringify(data, null, 4));
	// logger.debug('body: %s', JSON.stringify(data.body, null, 4));
	// logger.debug('query: %s', JSON.stringify(data.query, null, 4));
	// if (!data.performer) return logger.warn('Error Activating Subscription: Missing Performer: %s', data.performer);
	// if (!data.performer.price) return logger.warn('Error Activating Subscription: Missing Performer Price: %s', data.performer.price);
	// if (!data.query.token) return logger.warn('Error Activating Subscription: Missing Query Token: %s', data.query.token);
	// async.series([
	// 	// verify execution via PayPal token
	// 	function (step) {
	// 		PayPal.billingAgreement.execute(data.query.token, {}, function (err, billingAgreement) {
	// 		    if (err) return callback(err);
	// 		    logger.log("Billing Agreement Execute Response");
	// 		    logger.log(JSON.stringify(billingAgreement, 4, null));
	// 			if (billingAgreement.state=!'Active') return callback('Error Executing Billing Agreement: state- '+billingAgreement.stage);
	// 			step(null, billingAgreement);
	// 		});
	// 	},
	// 	// create and activate subscription
	// 	function (billingAgreement, step) {
	// 		var Subscription = require('../models/subscription');
	// 		var newSubscription = { 
	// 			'fan': data.fan._id,
	// 			'performer': data.performer._id,
	// 			'price': data.performer.price,
	// 			'agreementId': billingAgreement.id,
	// 			'subscribedVia': 'PayPal'
	// 		};
	// 		Subscription.create(newSubscription, function (err, subscription) {
	// 			if (err) return callback(err);
	// 			if (!subscription) return callback('Error Activating Supscription: Missing Subscription');
	// 			subscription.activateOrReactivate(config.default_days, subscription.price, function (err) {
	// 				callback(err);
	// 			});
	// 		});
	// 	}
	// ]);
// }
// module.exports.activateSubscription = activateSubscription;

// Cancel
// this is called by the Fan to cancel their subscription
//   it receives a response that it should ahve been canceled
//  there should also be a webhook for a successful agreement cancellation
// var cancelAgreement = function(billingAgreementId, callback) {
	// logger.log('Cancelling PayPal Subscription Agreement : %s', billingAgreementId);
	// var cancel_note = {
 //    	"note": "Canceling Subscription"
 //    };
	// PayPal.billingAgreement.cancel(billingAgreementId, cancel_note, function (err, response) {
 //        if (err) return callback(err);
 //        logger.debug('response: %s', JSON.stringify(response, 4, null));
 //        PayPal.billingAgreement.get(billingAgreementId, function (err, billingAgreement) {
	//         if (err) return callback(err);
	//         logger.debug('state: %s', billingAgreement.state);  
	//         if (billingAgreement.state=='Cancelled') {
	//         	var Subscription = require('../models/subscription');
	//         	return Subscription.findOneByPayPal(billingAgreementId, function (err, subscription) {
	//         		if (err) return callback(err);
	//         		if (!subscription) return callback('Missing Subscription: %s', billingAgreementId);
	//         		subscription.cancel(function (err) {
	//         			if (err) return callback(err);
	// 	        		logger.log('Cancelled PayPal Billing Agreement: %s', billingAgreementId);
	// 	        		callback(null);
	//         		});
	//         	});
	//         }
	//         else
	// 		    callback('Error Canceling PayPal Billing Agreement: '+billingAgreementId);
	//     });
 //    });
// }
// module.exports.cancelAgreement = cancelAgreement;

var createPaymentSingle = function(req, callback) {
	logger.log('Creating PayPal Payment Single');
	async.waterfall([
		function (step) {
			var User = require('../models/user');
			User.findById(req.user._id, function (err, user) {
				if (err) {
			        logger.warn(err);
			        return step('There was an error.');
			    }
			    if (!user) {
			        logger.warn('No user found!');
			        return step('There was an error.');
			    }
			    step(null, user);
			})
		},
		function (user, step) {
			var paymentSingleJSON = generatePurchasePaymentSingle();
			PayPal.payment.create(paymentSingleJSON, function (err, payment) {
			    if (err) {
			        logger.warn(err);
			        return step('There was an error.');
			    }
			    // logger.debug(payment);	    
		        for (var index = 0; index < payment.links.length; index++) {
		        //Redirect user to this endpoint for redirect url
		            if (payment.links[index].rel === 'approval_url') {
		                var approval_url = payment.links[index].href;
                        var token = require('url').parse(approval_url, true).query.token;
                        logger.log("Payment token: %s", token);
						callback(err, approval_url);
						user.paypal_tokens.push(token);
						user.paypal_total = paymentSingleJSON.transactions[0].amount.total;
						user.save(function (err) {
							if (err) logger.warn(err);
						});
		            }
		        }
			});
		}
	], function (err) {
		callback(err);
	});
}
module.exports.createPaymentSingle = createPaymentSingle;

var createPaymentDouble = function(req, callback) {
	logger.log('Creating PayPal Payment Double');
	async.waterfall([
		function (step) {
			var User = require('../models/user');
			User.findById(req.user._id, function (err, user) {
				if (err) {
			        logger.warn(err);
			        return step('There was an error.');
			    }
			    if (!user) {
			        logger.warn('No user found!');
			        return step('There was an error.');
			    }
			    step(null, user);
			})
		},
		function (user, step) {
			var paymentDoubleJSON = generatePurchasePaymentDouble();
			PayPal.payment.create(paymentDoubleJSON, function (err, payment) {
			    if (err) {
			        logger.warn(err);
			        return step('There was an error.');
			    }
			    // logger.debug(payment);	    
		        for (var index = 0; index < payment.links.length; index++) {
		        //Redirect user to this endpoint for redirect url
		            if (payment.links[index].rel === 'approval_url') {
		                var approval_url = payment.links[index].href;
                        var token = require('url').parse(approval_url, true).query.token;
                        logger.log("Payment token: %s", token);
						callback(err, approval_url);
						user.paypal_tokens.push(token);
						user.save(function (err) {
							if (err) logger.warn(err);
						});
		            }
		        }
			});
		}
	], function (err) {
		callback(err);
	});
}
module.exports.createPaymentDouble = createPaymentDouble;

var createPaymentTriple = function(req, callback) {
	logger.log('Creating PayPal Payment Triple');
	async.waterfall([
		function (step) {
			var User = require('../models/user');
			User.findById(req.user._id, function (err, user) {
				if (err) {
			        logger.warn(err);
			        return step('There was an error.');
			    }
			    if (!user) {
			        logger.warn('No user found!');
			        return step('There was an error.');
			    }
			    step(null, user);
			})
		},
		function (user, step) {
			var paymentTripleJSON = generatePurchasePaymentTriple();
			PayPal.payment.create(paymentTripleJSON, function (err, payment) {
			    if (err) {
			        logger.warn(err);
			        return step('There was an error.');
			    }
			    // logger.debug(payment);	    
		        for (var index = 0; index < payment.links.length; index++) {
		        //Redirect user to this endpoint for redirect url
		            if (payment.links[index].rel === 'approval_url') {
		                var approval_url = payment.links[index].href;
                        var token = require('url').parse(approval_url, true).query.token;
                        logger.log("Payment token: %s", token);
						callback(err, approval_url);
						user.paypal_tokens.push(token);
						user.save(function (err) {
							if (err) logger.warn(err);
						});
		            }
		        }
			});
		}
	], function (err) {
		callback(err);
	});
}
module.exports.createPaymentTriple = createPaymentTriple;




// var createPayout = function(amount, email, callback) {
// 	if (!amount) return callback('Error Creating Payout: Missing Amount');
// 	if (!email) return callback('Error Creating Payout: Missing Email');
// 	amount = new Money('USD', amount);
// 	logger.log('Sending PayPal Payout: %s -> %s', amount, email);
// 	var sender_batch_id = Math.random().toString(36).substring(9);
// 	var today = moment(new Date()).format('DD-MM-YYYY');
// 	var create_payout_json = {
// 	    "sender_batch_header": {
// 	        "sender_batch_id": sender_batch_id,
// 	        "email_subject": "Payout: $"+amount
// 	    },
// 	    "items": [
// 	        {
// 	            "recipient_type": "EMAIL",
// 	            "amount": {
// 	                "value": amount,
// 	                "currency": "USD"
// 	            },
// 	            "receiver": email,
// 	            "note": "Payout "+today,
// 	            "sender_item_id": Math.random().toString(36).substring(9)
// 	        }
// 	    ]
// 	};
// 	var sync_mode = 'true';
// 	PayPal.payout.create(create_payout_json, sync_mode, function (err, payout) {
// 	    if (err) return callback(err);
//         logger.log("Created Payout Response: %s", JSON.stringify(payout, null, 4));
// 		callback(null);	    
// 	});
// }
// module.exports.createPayout = createPayout;

// var reactivateAgreement = function(billingAgreementId, callback) {
// 	logger.log('Reactivating PayPal Subscription Agreement : %s', billingAgreementId);
// 	async.series([
// 		function (step) {
// 			// check if capable of being reactivated
// 			PayPal.billingAgreement.get(billingAgreementId, function (err, billingAgreement) {
// 		        if (err) return callback(err);
// 		        logger.debug('state: %s', billingAgreement.state);  
// 		        if (billingAgreement.state=='Active') return callback('Error Reactivating Subscription Agreement: Already Active');
// 		        if (billingAgreement.state=='Cancelled') return callback('Error Reactivating Subscription Agreement: Cancelled');
// 		        if (billingAgreement.state=='Expired') return callback('Error Reactivating Subscription Agreement: Expired');
// 		        if (billingAgreement.state!='Suspended') return callback('Error Reactivating Subscription Agreement: Not Suspended');
// 		        step(null);
// 		    });
// 		},
// 		function (step) {
// 			logger.debug('sending reactivation request...');
// 			var reactivate_note = {
// 		        "note": "Reactivating Agreement"
// 		    };
// 			PayPal.billingAgreement.reactivate(billingAgreementId, reactivate_note, function (err, response) {
// 			    if (err) return callback(err);
// 			    logger.debug('reactivation response: %s', JSON.stringify(response, 4, null));
// 			 	step(null)
// 		    });
// 		},
// 		function (step) {
// 			// check if request was successful and compare state
// 			PayPal.billingAgreement.get(billingAgreementId, function (err, billingAgreement) {
// 		        if (err) return callback(err);
// 		        logger.debug('state: %s', billingAgreement.state);  
// 		        if (billingAgreement.state=='Active') {
// 		        	var Subscription = require('../models/subscription');
// 		        	return Subscription.findOneByPayPal(billingAgreementId, function (err, subscription) {
// 		        		if (err) return callback(err);
// 		        		if (!subscription) return callback('Missing Subscription: %s', billingAgreementId);
// 		        		subscription.reactivate(function (err) {
// 		        			if (err) return callback(err);
// 		        			logger.log('Reactivated PayPal Billing Agreement: %s', billingAgreementId);
// 					        callback(null);
// 		        		});
// 		        	});
// 		        }
// 		        else
// 			    	callback('Error Reactivating PayPal Billing Agreement: '+billingAgreementId);
// 		    });
// 		},
// 	]);
// }
// module.exports.reactivateAgreement = reactivateAgreement;

// var suspendAgreement = function(billingAgreementId, callback) {
// 	logger.log('Suspending PayPal Subscription Agreement : %s', billingAgreementId);
// 	async.series([
// 		function (step) {
// 			// check if capapble of being reactivated
// 			PayPal.billingAgreement.get(billingAgreementId, function (err, billingAgreement) {
// 		        if (err) return callback(err);
// 		        logger.debug('state: %s', billingAgreement.state);  
// 		        if (billingAgreement.state=='Suspended') return callback('Error Suspending Subscription Agreement: Already Suspended');
// 		        if (billingAgreement.state=='Cancelled') return callback('Error Suspending Subscription Agreement: Cancelled');
// 		        if (billingAgreement.state=='Expired') return callback('Error Suspending Subscription Agreement: Expired');
// 		        if (billingAgreement.state!='Active') return callback('Error Suspending Subscription Agreement: Not Active');
// 		        step(null);
// 		    });
// 		},
// 		function (step) {
// 			logger.debug('sending suspending request...');
// 			var suspend_note = {
// 		        "note": "Suspending Subscription"
// 		    };
// 			PayPal.billingAgreement.suspend(billingAgreementId, suspend_note, function (err, response) {
// 			    if (err) return callback(err);
// 			    logger.debug('suspending response: %s', JSON.stringify(response, 4, null));
// 			 	step(null)
// 		    });
// 		},
// 		function (step) {
// 			// check if request was successful and compare state
// 			PayPal.billingAgreement.get(billingAgreementId, function (err, billingAgreement) {
// 		        if (err) return callback(err);
// 		        logger.debug('state: %s', billingAgreement.state);  
// 		        if (billingAgreement.state=='Suspended') {
// 		        	var Subscription = require('../models/subscription');
// 		        	return Subscription.findOneByPayPal(billingAgreementId, function (err, subscription) {
// 		        		if (err) return callback(err);
// 		        		if (!subscription) return callback('Missing Subscription: %s', billingAgreementId);
// 		        		subscription.suspend(function (err) {
// 		        			if (err) return callback(err);
// 		        			logger.log('Suspended PayPal Billing Agreement: %s', billingAgreementId);
// 					        callback(null);
// 		        		});
// 		        	});
// 		        }
// 		        else
// 			    	callback('Error Suspending PayPal Billing Agreement: '+billingAgreementId);
// 		    });
// 		},
// 	]);
// }
// module.exports.suspendAgreement = suspendAgreement;

////////////

// Webhooks

var handleWebhook = function (eventType, body) {
	logger.hook('Handling PayPal Webhook');
	logger.debug('eventType: %s', eventType);
	// logger.debug('body: %s', JSON.stringify(body, 4, null));
	// new sale
	if (eventType=='CHECKOUT.ORDER.PROCESSED') 
		checkout(body);
	else if (eventType=='CHECKOUT.ORDER.COMPLETED') 
		checkout(body);
	// created
	// else if (eventType=='BILLING.SUBSCRIPTION.CREATED')
		// subscriptionCreated(body)
	// cancellation
	// else if (eventType=='BILLING.SUBSCRIPTION.CANCELLED')
		// subscriptionCanceled(body);
	// reactivated
	// else if (eventType=='BILLING.SUBSCRIPTION.RE-ACTIVATED')
		// subscriptionReactivated(body);
	// suspended
	// else if (eventType=='BILLING.SUBSCRIPTION.SUSPENDED')
		// subscriptionSuspended(body);
	// updated
	// else if (eventType=='BILLING.SUBSCRIPTION.UPDATED')
		// subscriptionUpdated(body);
	// refund
	else if (eventType=='PAYMENT.SALE.REVERSED')
		subscriptionRefunded(body);
	else if (eventType=='PAYMENT.SALE.COMPLETED')
		checkout(body);
}
module.exports.handleWebhook = handleWebhook;

// Syncs Webhooks w/ existing on PayPal's servers
function syncWebhooks(callback) {
	logger.hook('Syncing PayPal Webhooks');
	async.waterfall([
		function (step) {
			// get list of current paypal webhooks
			PayPal.notification.webhook.list(function (err, webhooks) {
				if (err) {
					logger.warn('Error Listing PayPal Webhooks');
					return step(err);
				}
		        logger.debug('PayPal Webhooks:\n-%s', _.pluck(webhooks.webhooks[0].event_types, 'name').join('\n-'));
			    step(err, webhooks.webhooks[0]);
			});
		},
		function (webhooks, step) {
			var hooks = webhooks.event_types,
				add = false;
			for (var i=0;i<config.paypal_webhooks.length;i++) {
				if (!_.contains(_.pluck(webhooks.event_types, 'name'), config.paypal_webhooks[i])) {
					logger.debug('adding webhook: %s', config.paypal_webhooks[i]);
					hooks.push({"name":config.paypal_webhooks[i]});
					add = true;
				}
			}
			if (!add) {
				logger.log('No PayPal Webhooks to Create');
				return callback(null);
			}
			var create_webhook_json = {
			    "url": config.webhooks_url,
			    "event_types": hooks
			};
			PayPal.notification.webhook.create(create_webhook_json, function (err, newWebhooks) {
			    if (err) {
			    	if (err.response.name=='WEBHOOK_URL_ALREADY_EXISTS') {
			    		logger.warn('Error creating PayPal Webhooks: Already Exist');
			    		logger.debug('updating PayPal Webhooks...');
						var webhook_replace_attributes = [
					        {
					            "op": "replace",
					            "path": "/event_types",
					            "value": hooks
					        }
					    ];
						return PayPal.notification.webhook.replace(webhooks.id, webhook_replace_attributes, function (err, results) {
						    if (err) {
						    	logger.warn(err);
						    	return step(err);
						    }
						    logger.log('Updated PayPal Webhooks');
						    logger.log(JSON.stringify(results, null, 4));
						    callback(null);
						});

			    	}
			    	logger.warn('Error creating PayPal Webhooks');
			    	return step(err);
			    }
		        logger.log("Created PayPal Webhooks");
		        logger.debug(JSON.stringify(newWebhooks, null, 4));
			    callback(null);
			});
		}
	], function (err) {
		callback(err);
	});
}
module.exports.syncWebhooks = syncWebhooks;

////////////

// Checkout API

// Checkout Order
function checkout(body) {
	logger.hook('Checkout via PayPal');
	logger.debug('body: %s', JSON.stringify(body, 4, null));
	var agreementId = body.id || null;
	logger.debug('subscriptionId (agreementId): %s', agreementId);
	if (body.status=="CREATED") {
		logger.hook('Sale Created (PayPal): %s', agreementId);
	}
	else if (body.status=="APPROVED") {
		logger.hook('Sale Approved (PayPal): %s', agreementId);
	}
	else if (body.status=="COMPLETED") {
		logger.hook('Sale Completed (PayPal): %s', agreementId);
	}
	else if (body.status=="FAILED") {
		logger.hook('Sale Failed (PayPal): %s', agreementId);
	}
}

////////////

// Subscription API

// item_number -> performer.snapchat
// custom -> fan._id

// custom -> performer.snapchat
// item_number -> fan._id

// Cancelled
// function subscriptionCanceled(body) {
// 	var Subscription = require('../models/subscription');
// 	logger.hook('Cancelling PayPal Subscription: %s - %s: %s', body.id, body.name, body.description);
// 	logger.debug('body: %s', JSON.stringify(body, 4, null));
//     Subscription.findOneByPayPal(body.id, function (err, subscription) {
//     	if (err) return logger.warn(err);
//     	if (!subscription) return logger.warn('Missing subscription: %s', body);
//     	subscription.cancel(function (err) {
//     		if (err) return logger.warn(err);
//     		logger.hook('Cancelled PayPal Subscription: %s', subscriptionId);
//     	});
//     });
// }

// Created
// function subscriptionCreated(body) {
	// logger.hook('Created PayPal Subscription: %s - %s: %s', body.id, body.name, body.description);
	// logger.debug('body: %s', JSON.stringify(body, 4, null));
	// if (config.PayPal_activate_on_webhook) {}
// }

// Reactivated
// function subscriptionReactivated(body) {
// 	var Subscription = require('../models/subscription');
// 	logger.hook('Reactivating PayPal Subscription: %s - %s: %s', body.id, body.name, body.description);
// 	logger.debug('body: %s', JSON.stringify(body, 4, null));
// 	Subscription.findOneByPayPal(body.id, function (err, subscription) {
//     	if (err) return logger.warn(err);
//     	if (!subscription) return logger.warn('Missing subscription: %s', body);
//     	subscription.reactivate(function (err) {
//     		if (err) return logger.warn(err);
//     		logger.hook('Reactivated PayPal Subscription: %s', body.plan.id);
//     	});
//     });
// }

// Refunded
// function subscriptionRefunded(body) {
// 	var Subscription = require('../models/subscription');
// 	logger.hook('Refunding PayPal Subscription: %s - %s: %s', body.id, body.name, body.description);
// 	logger.debug('body: %s', JSON.stringify(body, 4, null));
// 	Subscription.findOneByPayPal(body.id, function (err, subscription) {
//     	if (err) return logger.warn(err);
//     	if (!subscription) return logger.warn('Missing subscription: %s', body);
//     	subscription.refund(function (err) {
//     		if (err) return logger.warn(err);
//     		logger.hook('Refunded PayPal Subscription: %s', body.plan.id);
//     	});
//     });
// }

// Suspended
// function subscriptionSuspended(body) {
// 	var Subscription = require('../models/subscription');
// 	logger.hook('Suspending PayPal Subscription: %s - %s: %s', body.id, body.name, body.description);
// 	logger.debug('body: %s', JSON.stringify(body, 4, null));
// 	Subscription.findOneByPayPal(body.id, function (err, subscription) {
//     	if (err) return logger.warn(err);
//     	if (!subscription) return logger.warn('Missing subscription: %s', body);
//     	subscription.suspend(function (err) {
//     		if (err) return logger.warn(err);
//     		logger.hook('Suspended PayPal Subscription: %s', body.plan.id);
//     	});
//     });
// }

// Updated
// function subscriptionUpdated(body) {
// 	var Subscription = require('../models/subscription');
// 	logger.hook('Updating PayPal Subscription: %s - %s: %s', body.id, body.name, body.description);
// 	logger.debug('body: %s', JSON.stringify(body, 4, null));
// 	Subscription.findOneByPayPal(body.id, function (err, subscription) {
//     	if (err) return logger.warn(err);
//     	if (!subscription) return logger.warn('Missing subscription: %s', body);
//     	subscription.update(body, function (err) {
//     		if (err) return logger.warn(err);
//     		logger.hook('Updated PayPal Subscription: %s', body.plan.id);
//     	});
//     });
// }

// Verify
function verifyWebhook(req, callback) {
	return callback(null);

	// Sends the webhook event data to PayPal to verify the webhook event signature is correct and 
	// the event data came from PayPal.

	// Note this sample is only for illustrative purposes. You must have a valid webhook configured with your
	// client ID and secret. This sample may not work due to other tests deleting and creating webhooks.

	// Normally, you would pass all the HTTP request headers sent in the Webhook Event, but creating a
	// JSON object here for the sample.
	var certURL = "https://api.sandbox.paypal.com/v1/notifications/certs/CERT-360caa42-fca2a594-a5cafa77";
	var transmissionId = "103e3700-8b0c-11e6-8695-6b62a8a99ac4";
	var transmissionSignature = "t8hlRk64rpEImZMKqgtp5dlWaT1W8ed/mf8Msos341QInVn3BMQubjAhM/cKiSJtW07VwJvSX7X4+YUmHBrm5BQ+CEkClke4Yf4ouhCK6GWsfs0J8cKkmjI0XxfJpPLgjROEWY3MXorwCtbvrEo5vrRI2+TyLkquBKAlM95LbNWG43lxMu0LHzsSRUBDdt5IP1b2CKqbcEJKGrC78iw+fJEQGagkJAiv3Qvpw8F/8q7FCQAZ3c81mzTvP4ZH3Xk2/nNznEA7eMi3u1EjSpTmLfAb423ytX37Ts0QpmPNgxJe8wnMB/+fvt4xjYH6KNe+bIcYU30hUIe9O8c9UFwKuQ==";
	var transmissionTimestamp = "2016-10-05T14:57:40Z";
	var headers = {
	    'paypal-auth-algo': 'SHA256withRSA',
	    'paypal-cert-url': certURL,
	    'paypal-transmission-id': transmissionId,
	    'paypal-transmission-sig': transmissionSignature,
	    'paypal-transmission-time': transmissionTimestamp
	};

	// The eventBody parameter is the entire webhook event body.
	var eventBody = '{"id":"WH-82L71649W50323023-5WC64761VS637831A","event_version":"1.0","create_time":"2016-10-05T14:57:40Z","resource_type":"sale","event_type":"PAYMENT.SALE.COMPLETED","summary":"Payment completed for $ 6.01 USD","resource":{"id":"8RS6210148826604N","state":"completed","amount":{"total":"6.01","currency":"USD","details":{"subtotal":"3.00","tax":"0.01","shipping":"1.00","handling_fee":"2.00","shipping_discount":"3.00"}},"payment_mode":"INSTANT_TRANSFER","protection_eligibility":"ELIGIBLE","protection_eligibility_type":"ITEM_NOT_RECEIVED_ELIGIBLE,UNAUTHORIZED_PAYMENT_ELIGIBLE","transaction_fee":{"value":"0.47","currency":"USD"},"invoice_number":"","custom":"Hello World!","parent_payment":"PAY-11X29866PC6848407K72RIQA","create_time":"2016-10-05T14:57:18Z","update_time":"2016-10-05T14:57:26Z","links":[{"href":"https://api.sandbox.paypal.com/v1/payments/sale/8RS6210148826604N","rel":"self","method":"GET"},{"href":"https://api.sandbox.paypal.com/v1/payments/sale/8RS6210148826604N/refund","rel":"refund","method":"POST"},{"href":"https://api.sandbox.paypal.com/v1/payments/payment/PAY-11X29866PC6848407K72RIQA","rel":"parent_payment","method":"GET"}]},"links":[{"href":"https://api.sandbox.paypal.com/v1/notifications/webhooks-events/WH-82L71649W50323023-5WC64761VS637831A","rel":"self","method":"GET"},{"href":"https://api.sandbox.paypal.com/v1/notifications/webhooks-events/WH-82L71649W50323023-5WC64761VS637831A/resend","rel":"resend","method":"POST"}]}';

	// The webhookId is the ID of the configured webhook (can find this in the PayPal Developer Dashboard or
	// by doing a paypal.webhook.list()
	var webhookId = "3TR748995U920805P";

	PayPal.notification.webhookEvent.verify(headers, eventBody, webhookId, function (err, response) {
	    if (err) return callback(err)
        // Verification status must be SUCCESS
        if (response.verification_status === "SUCCESS") {
            logger.debug("successful webhook verification");
            return callback(null);
        } 
        logger.warn("unsuccessful webhook verification");
        logger.debug('response: %s', JSON.stringify(response, 4, null));
        callback('There was an error validating!');
	});
}
module.exports.verifyWebhook = verifyWebhook;

////// Helpers //////

function generatePurchasePaymentSingle() {
	return {
	    "intent": "sale",
	    "payer": {
	        "payment_method": "paypal"
	    },
	    "redirect_urls": {
	        "return_url": config.paypal_success_url,
	        "cancel_url": config.paypal_cancel_url
	    },
	    "transactions": [{
	        "item_list": {
	            "items": [{
	                "name": "30 minutes",
	                "sku": "rate2x",
	                "price": "5.00",
	                "currency": "USD",
	                "quantity": 1
	            }]
	        },
	        "amount": {
	            "currency": "USD",
	            "total": "5.00"
	        },
	        "description": "Time for DeezNuts"
	    }]
	};
}

function generatePurchasePaymentDouble() {
	return {
	    "intent": "sale",
	    "payer": {
	        "payment_method": "paypal"
	    },
	    "redirect_urls": {
	        "return_url": config.paypal_success_url,
	        "cancel_url": config.paypal_cancel_url
	    },
	    "transactions": [{
	        "item_list": {
	            "items": [{
	                "name": "1 hour",
	                "sku": "rate3x",
	                "price": "10.00",
	                "currency": "USD",
	                "quantity": 1
	            }]
	        },
	        "amount": {
	            "currency": "USD",
	            "total": "10.00"
	        },
	        "description": "Time for DeezNuts"
	    }]
	};
}

function generatePurchasePaymentTriple() {
	return {
	    "intent": "sale",
	    "payer": {
	        "payment_method": "paypal"
	    },
	    "redirect_urls": {
	        "return_url": config.paypal_success_url,
	        "cancel_url": config.paypal_cancel_url
	    },
	    "transactions": [{
	        "item_list": {
	            "items": [{
	                "name": "2 hours",
	                "sku": "rate4x",
	                "price": "20.00",
	                "currency": "USD",
	                "quantity": 1
	            }]
	        },
	        "amount": {
	            "currency": "USD",
	            "total": "20.00"
	        },
	        "description": "Time for DeezNuts"
	    }]
	};
}

function generatePaymentExecuteJSON(id, total) {
	return {
	    "payer_id": id,
	    "transactions": [{
	        "amount": {
	            "currency": "USD",
	            "total": total
	        }
	    }]
	};
}


function generateBillingAgreement(id) {
	var tz = require('moment-timezone');
	var isoDate =  moment(new Date()).tz('America/Los_Angeles')
	isoDate = isoDate.add(1,'days');
	isoDate = isoDate.add(5,'minutes');
	var date = moment(new Date(isoDate)).format('YYYY-MM-DD');
	var time = moment(new Date(isoDate)).format('HH:mm:ss');
	isoDate = date+"T"+time+"Z";
	return {
	    "name": "Subscription Agreement",
	    "description": "Agreement for Membership",
	    "start_date": isoDate,
	    "plan": {
	        "id": id
	    },
	    "payer": {
	        "payment_method": "paypal"
	    }
	};
}

//////////////////////////

/* paypal webhook events 

BILLING.PLAN.CREATED 	A billing plan is created. 	Create billing plan
BILLING.PLAN.UPDATED 	A billing plan is updated. 	Update billing plan
BILLING.SUBSCRIPTION.CANCELLED 	A billing agreement is canceled. 	Cancel agreement
BILLING.SUBSCRIPTION.CREATED 	A billing agreement is created. 	Create agreement
BILLING.SUBSCRIPTION.RE-ACTIVATED 	A billing agreement is re-activated. 	Re-activate agreement
BILLING.SUBSCRIPTION.SUSPENDED 	A billing agreement is suspended. 	Suspend agreement
BILLING.SUBSCRIPTION.UPDATED 	A billing agreement is updated.

CHECKOUT.ORDER.PROCESSED 	See CHECKOUT.ORDER.PROCESSED.
CUSTOMER.ACCOUNT-LIMITATION.ADDED 	A limitation is added for a partner's merchant account. 	Update merchant account
CUSTOMER.ACCOUNT-LIMITATION.ESCALATED 	A limitation is escalated for a partner's merchant account. 	Update merchant account
CUSTOMER.ACCOUNT-LIMITATION.LIFTED 	A limitation is lifted for a partner's merchant account. 	Update merchant account
CUSTOMER.ACCOUNT-LIMITATION.UPDATED 	A limitation is updated for a partner's merchant account. 	Update merchant account
MERCHANT.ONBOARDING.COMPLETED 	See MERCHANT.ONBOARDING.COMPLETED.
MERCHANT.PARTNER-CONSENT.REVOKED 	See MERCHANT.PARTNER-CONSENT.REVOKED.
PAYMENT.CAPTURE.COMPLETED 	See PAYMENT.CAPTURE.COMPLETED.
PAYMENT.CAPTURE.DENIED 	See PAYMENT.CAPTURE.DENIED.
PAYMENT.CAPTURE.REFUNDED 	See PAYMENT.CAPTURE.REFUNDED.
PAYMENT.REFERENCED-PAYOUT-ITEM.COMPLETED 	See PAYMENT.REFERENCED-PAYOUT-ITEM.COMPLETED.
PAYMENT.REFERENCED-PAYOUT-ITEM.FAILED 	See PAYMENT.REFERENCED-PAYOUT-ITEM.FAILED.

CUSTOMER.DISPUTE.CREATED 	A customer dispute is created. 	Customer Disputes
CUSTOMER.DISPUTE.RESOLVED 	A customer dispute is resolved. 	Customer Disputes
CUSTOMER.DISPUTE.UPDATED 	A customer dispute is updated. 	Customer Disputes
RISK.DISPUTE.CREATED 	A risk dispute is created. 	Deprecated. No payload.

IDENTITY.AUTHORIZATION-CONSENT.REVOKED 	A user's consent token is revoked.

INVOICING.INVOICE.CANCELLED 	A merchant or customer cancels an invoice. 	Cancel invoice
INVOICING.INVOICE.CREATED 	An invoice is created. 	Create draft invoice
INVOICING.INVOICE.PAID 	An invoice is paid, partially paid, or payment is made and is pending. 	Mark invoice as paid
INVOICING.INVOICE.REFUNDED 	An invoice is refunded or partially refunded. 	Mark invoice as refunded
INVOICING.INVOICE.SCHEDULED 	An invoice is scheduled. 	Schedule invoice
INVOICING.INVOICE.UPDATED 	An invoice is updated. 	Update invoice

MERCHANT.ONBOARDING.COMPLETED 	A merchant completes setup. 	Marketplaces Connected Path Onboarding
MERCHANT.PARTNER-CONSENT.REVOKED 	The consents for a merchant account setup are revoked or an account is closed.

PAYMENT.AUTHORIZATION.CREATED 	A payment authorization is created, approved, executed, or a future payment authorization is created. 	Create payment with intent set to authorize
PAYMENT.AUTHORIZATION.VOIDED 	A payment authorization is voided.

PAYMENT.CAPTURE.COMPLETED 	A payment capture completes. 	Show captured payment details
PAYMENT.CAPTURE.DENIED 	A payment capture is denied. 	Show captured payment details
PAYMENT.CAPTURE.PENDING 	The state of a payment capture changes to pending. 	Show captured payment details
PAYMENT.CAPTURE.REFUNDED 	A merchant refunds a payment capture. 	Refund captured payment
PAYMENT.CAPTURE.REVERSED 	PayPal reverses a payment capture.

PAYMENT.ORDER.CANCELLED 	A payment order is canceled. 	Void order
PAYMENT.ORDER.CREATED 	A payment order is created.

PAYMENT.PAYOUTSBATCH.DENIED 	A batch payout payment is denied. 	Show payout details
PAYMENT.PAYOUTSBATCH.PROCESSING 	The state of a batch payout payment changes to processing. 	Show payout details
PAYMENT.PAYOUTSBATCH.SUCCESS 	A batch payout payment completes successfully. 	Show payout details
PAYMENT.PAYOUTS-ITEM.BLOCKED 	A payouts item was blocked. 	Show payout item details
PAYMENT.PAYOUTS-ITEM.CANCELED 	A payouts item is canceled. 	Cancel unclaimed payout item
PAYMENT.PAYOUTS-ITEM.DENIED 	A payouts item is denied. 	Show payout item details
PAYMENT.PAYOUTS-ITEM.FAILED 	A payouts item fails. 	Show payout item details
PAYMENT.PAYOUTS-ITEM.HELD 	A payouts item is held. 	Show payout item details
PAYMENT.PAYOUTS-ITEM.REFUNDED 	A payouts item is refunded. 	Show payout item details
PAYMENT.PAYOUTS-ITEM.RETURNED 	A payouts item is returned. 	Show payout item details
PAYMENT.PAYOUTS-ITEM.SUCCEEDED 	A payouts item succeeds. 	Show payout item details
PAYMENT.PAYOUTS-ITEM.UNCLAIMED 	A payouts item is unclaimed.

PAYMENT.REFERENCED-PAYOUT-ITEM.COMPLETED 	Funds were disbursed to the seller and partner. 	Create referenced payout item
PAYMENT.REFERENCED-PAYOUT-ITEM.FAILED 	Disbursment of funds were attempted, but failed to send.

PAYMENT.SALE.COMPLETED 	A sale completes. 	Show sale details
PAYMENT.SALE.DENIED 	The state of a sale changes from pending to denied. 	Show sale details
PAYMENT.SALE.PENDING 	The state of a sale changes to pending. 	Show sale details
PAYMENT.SALE.REFUNDED 	A merchant refunds a sale. 	Refund sale
PAYMENT.SALE.REVERSED 	PayPal reverses a sale.

VAULT.CREDIT-CARD.CREATED 	A credit card is created. 	Store credit card
VAULT.CREDIT-CARD.DELETED 	A credit card is deleted. 	Delete vaulted credit card

*/