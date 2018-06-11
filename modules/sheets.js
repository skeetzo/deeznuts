var _ = require('underscore'),
	GoogleSpreadsheet = require('google-spreadsheet'),
    config = require('../config/index.js'),
    logger = config.logger,
	async = require('async'),
    moment = require('moment'),
    User = require('../models/user'),
    Fan = require('../models/fan'),
    Performer = require('../models/performer'),
    Payment = require('../models/payment'),
    Payout = require('../models/payout'),
    Subscription = require('../models/subscription');

const TWO_MINUTES = 120000,
	  FIVE_MINUTES = 300000,
	  TEN_MINUTES = 600000;

var doc; // Spreadsheet Doc

module.exports = {

	/*
		saves fans
	*/
	saveFans : function(callback) {
		var self = this;
		logger.debug('Saving Fans to Kairos');
		var doc = new GoogleSpreadsheet(config.Google_Spreadsheet_id);
		async.waterfall([
		  function setAuth(step) {
		    doc.useServiceAccountAuth(config.Google_Oauth_Opts, step);
		  },
		  function getInfoAndWorksheets(step) {
		    doc.getInfo(function (err, info) {
		      if (err) return callback(err);
		      logger.debug('Loaded sheet: '+info.title);
		      for (var i=0;i<info.worksheets.length;i++)
		      	if (info.worksheets[i].title=='fans') 
		      		sheet = info.worksheets[i];
		      step(null, sheet);
		    });
		  },
		  function getFans(sheet, step) {
		  	Fan.find({}, function (err, fans) {
		  		if (err) logger.warn(err);
		  		logger.debug('saving fans: %s',fans.length);
		  		step(null, sheet, fans);
		  	})
		  },
		  function workingWithRows(sheet, fans, step) {
		    sheet.getRows({
		      offset: 1,
		      orderby: 'col1',
		    }, function (err, rows) {
		    	if (err) return callback(err);
		    	rows = _.toArray(rows);
		    	for (var i=0;i<rows.length;i++) 
		    		for (var j=0;j<fans.length;j++)
			    		if (rows[i]['_id']==fans[j]._id) {
			    			// logger.log('row found: %s',fans[j].subscriptions.length);
			    			rows[i]['username'] = fans[j].username;
	          				rows[i]['snapchat'] = fans[j].snapchat;
	          				rows[i]['price'] = fans[j].price;
	          				rows[i]['start'] = fans[j].start;
	          				rows[i]['subscriptions'] = fans[j].subscriptions.length;
	          				rows[i]['active'] = fans[j].active;
	          				rows[i]['gross'] = fans[j].total_gross;
	          				fans[j].added = true;
	          				rows[i].save(function() {});
			    		}
		    	for (var i=0;i<fans.length;i++) {
		    		if (fans[i].added) continue;
          			// logger.log('fans[%s]: %s',i,JSON.stringify(fans[i]));
          			sheet.addRow({
          				'_id':fans[i]._id,
          				'name':fans[i].name,
          				'username':fans[i].username,
          				'snapchat':fans[i].snapchat,
          				'price':fans[i].price,
          				'start':fans[i].start,
          				'subscriptions':fans[i].subscriptions.length,
          				'active':fans[i].active,
          				'gross':fans[i].total_gross,
          			}, function() {});
          		}
	          	logger.log('Fans saved to Kairos');
	          	callback(null);
        	});
        }], function(err) {
        	if (err.message.indexOf('EAI_AGAIN')>-1) return callback('Cannot Connect to Google');
        	if (err) callback(err.message);
        });
	},

	savePayments : function(callback) {
		var self = this;
		logger.debug('Saving Payments to Kairos');
		var doc = new GoogleSpreadsheet(config.Google_Spreadsheet_id);
		async.waterfall([
		  function setAuth(step) {
		    doc.useServiceAccountAuth(config.Google_Oauth_Opts, step);
		  },
		  function getInfoAndWorksheets(step) {
		    doc.getInfo(function (err, info) {
		      if (err) return step(err);
		      logger.debug('Loaded sheet: '+info.title);
		      for (var i=0;i<info.worksheets.length;i++)
		      	if (info.worksheets[i].title=='payments') 
		      		return step(null, info.worksheets[i]);
		    });
		  },
		  function getPayments(sheet, step) {
		  	Payment.find({}, function (err, payments) {
		  		if (err) return step(err);
		  		logger.debug('saving payments: %s',payments.length);
		  		step(null, sheet, payments);
		  	})
		  },
		  function workingWithRows(sheet, payments, step) {
		    sheet.getRows({
		      offset: 1,
		      orderby: 'col1',
		    }, function (err, rows) {
		    	if (err) return callback(err);
		    	rows = _.toArray(rows);
		    	for (var i=0;i<rows.length;i++) 
		    		for (var j=0;j<payments.length;j++)
			    		if (rows[i]['_id']==payments[j]._id) {
			    			// logger.log('row found: %s',payments[j].subscriptions.length);
			    			rows[i]['fan'] = payments[j].fan;
			    			rows[i]['date'] = payments[j].date;
	          				rows[i]['time'] = payments[j].time;
	          				rows[i]['amount'] = payments[j].amount;
	          				rows[i]['fee'] = payments[j].fee;
	          				rows[i]['kairos_fee'] = payments[j].kairos_fee;
	          				rows[i]['net'] = payments[j].net;
	          				rows[i]['status'] = payments[j].status;
	          				payments[j].added = true;
	          				rows[i].save(function() {});
			    		}
		    	for (var i=0;i<payments.length;i++) {
		    		if (payments[i].added) continue;
          			// logger.log('performer[%s]: %s',i,JSON.stringify(payments[i]));
          			sheet.addRow({
          				'_id': payments[i]._id,
          				'performer':payments[i].performer,
          				'fan':payments[i].fan,
          				'date':payments[i].date,
          				'time':payments[i].time,
          				'amount':payments[i].amount,
          				'fee':payments[i].fee,
          				'kairos_fee':payments[i].kairos_fee,
          				'net':payments[i].net,
          				'status':payments[i].status
          			}, function() {});
          		}
	          	logger.log('Payments saved to Kairos');
	          	callback(null);
        	});
        }], function(err) {
        	if (err.message.indexOf('EAI_AGAIN')>-1) return callback('Cannot Connect to Google');
        	if (err) callback(err.message);
        });
	},

	savePayouts : function(callback) {
		var self = this;
		logger.debug('Saving Payouts to Kairos');
		var doc = new GoogleSpreadsheet(config.Google_Spreadsheet_id);
		async.waterfall([
		  function setAuth(step) {
		    doc.useServiceAccountAuth(config.Google_Oauth_Opts, step);
		  },
		  function getInfoAndWorksheets(step) {
		    doc.getInfo(function (err, info) {
		      if (err) return callback(err);
		      logger.debug('Loaded sheet: '+info.title);
		      for (var i=0;i<info.worksheets.length;i++)
		      	if (info.worksheets[i].title=='payouts') 
		      		return step(null, info.worksheets[i]);
		    });
		  },
		  function getPayouts(sheet, step) {
		  	Payout.find({}, function (err, payouts) {
		  		if (err) return step(err);
		  		logger.debug('saving payouts: %s',payouts.length);
		  		step(null, sheet, payouts);
		  	})
		  },
		  function workingWithRows(sheet, payouts, step) {
		    sheet.getRows({
		      offset: 1,
		      orderby: 'col1',
		    }, function (err, rows) {
		    	if (err) return callback(err);
		    	rows = _.toArray(rows);
		    	for (var i=0;i<rows.length;i++) 
		    		for (var j=0;j<payouts.length;j++)
			    		if (rows[i]['_id']==payouts[j]._id) {
			    			// logger.log('row found: %s',payouts[j].subscriptions.length);
			    			rows[i]['date'] = payouts[j].date;
	          				rows[i]['time'] = payouts[j].time;
	          				rows[i]['amount'] = payouts[j].amount;
	          				rows[i]['status'] = payouts[j].status;
	          				payouts[j].added = true;
	          				rows[i].save(function() {});
			    		}
		    	for (var i=0;i<payouts.length;i++) {
		    		if (payouts[i].added) continue;
          			// logger.log('performer[%s]: %s',i,JSON.stringify(payouts[i]));
          			sheet.addRow({
          				'_id':payouts[i]._id,
          				'performer':payouts[i].performer,
          				'date':payouts[i].date,
          				'time':payouts[i].time,
          				'amount':payouts[i].amount,
          				'status':payouts[i].status
          			}, function() {});
          		}
	          	logger.log('Payouts saved to Kairos');
	          	callback(null);
        	});
        }], function(err) {
        	if (err.message.indexOf('EAI_AGAIN')>-1) return callback('Cannot Connect to Google');
        	if (err) callback(err.message);
        });
	},

	/*
		saves performers
	*/
	savePerformers : function(callback) {
		var self = this;
		logger.debug('Saving Performers to Kairos');
		var doc = new GoogleSpreadsheet(config.Google_Spreadsheet_id);
		async.waterfall([
		  function setAuth(step) {
		    doc.useServiceAccountAuth(config.Google_Oauth_Opts, step);
		  },
		  function getInfoAndWorksheets(step) {
		    doc.getInfo(function (err, info) {
		      if (err) return callback(err);
		      logger.debug('Loaded sheet: '+info.title);
		      for (var i=0;i<info.worksheets.length;i++)
		      	if (info.worksheets[i].title=='performers') 
		      		return step(null, info.worksheets[i]);
		    });
		  },
		  function getPerformers(sheet, step) {
		  	Performer.find({}, function (err, performers) {
		  		if (err) logger.warn(err);
		  		logger.debug('saving performers: %s',performers.length);
		  		step(null, sheet, performers);
		  	})
		  },
		  function workingWithRows(sheet, performers, step) {
		    sheet.getRows({
		      offset: 1,
		      orderby: 'col1',
		    }, function (err, rows) {
		    	if (err) return callback(err);
		    	rows = _.toArray(rows);
		    	for (var i=0;i<rows.length;i++) 
		    		for (var j=0;j<performers.length;j++)
			    		if (rows[i]['_id']==performers[j]._id) {
			    			// logger.log('row found: %s',performers[j].subscriptions.length);
			    			rows[i]['username'] = performers[j].username;
	          				rows[i]['snapchat'] = performers[j].snapchat;
	          				rows[i]['price'] = performers[j].price;
	          				rows[i]['start'] = performers[j].start;
	          				rows[i]['subscriptions'] = performers[j].subscriptions.length;
	          				rows[i]['active'] = performers[j].active;
	          				rows[i]['gross'] = performers[j].total_gross;
	          				performers[j].added = true;
	          				rows[i].save(function() {});
			    		}
		    	for (var i=0;i<performers.length;i++) {
		    		if (performers[i].added) continue;
          			// logger.log('performer[%s]: %s',i,JSON.stringify(performers[i]));
          			sheet.addRow({
          				'_id':performers[i]._id,
          				'name':performers[i].name,
          				'username':performers[i].username,
          				'snapchat':performers[i].snapchat,
          				'price':performers[i].price,
          				'start':performers[i].start,
          				'subscriptions':performers[i].subscriptions.length,
          				'active':performers[i].active,
          				'gross':performers[i].total_gross,
          			}, function() {});
          		}
	          	logger.log('Performers saved to Kairos');
	          	callback(null);
        	});
        }], function(err) {
        	if (err.message.indexOf('EAI_AGAIN')>-1) return callback('Cannot Connect to Google');
        	if (err) callback(err.message);
        });
	},

	saveSubscriptions : function(callback) {
		var self = this;
		logger.debug('Saving Subscriptions to Kairos');
		var doc = new GoogleSpreadsheet(config.Google_Spreadsheet_id);
		async.waterfall([
		  function setAuth(step) {
		    doc.useServiceAccountAuth(config.Google_Oauth_Opts, step);
		  },
		  function getInfoAndWorksheets(step) {
		    doc.getInfo(function (err, info) {
		      if (err) return callback(err);
		      logger.debug('Loaded sheet: '+info.title);
		      for (var i=0;i<info.worksheets.length;i++)
		      	if (info.worksheets[i].title=='subscriptions') 
		      		return step(null, info.worksheets[i]);
		    });
		  },
		  function getSubscriptions(sheet, step) {
		  	Subscription.find({}, function (err, subscriptions) {
		  		if (err) return step(err);
		  		logger.debug('saving subscriptions: %s',subscriptions.length);
		  		step(null, sheet, subscriptions);
		  	})
		  },
		  function workingWithRows(sheet, subscriptions, step) {
		    sheet.getRows({
		      offset: 1,
		      orderby: 'col1',
		    }, function (err, rows) {
		    	if (err) return callback(err);
		    	rows = _.toArray(rows);
		    	for (var i=0;i<rows.length;i++) 
		    		for (var j=0;j<subscriptions.length;j++)
			    		if (rows[i]['_id']==subscriptions[j]._id) {
			    			// logger.log('row found: %s',subscriptions[j].subscriptions.length);
			    			rows[i]['fan'] = subscriptions[j].fan;
	          				rows[i]['price'] = subscriptions[j].price;
	          				rows[i]['start'] = subscriptions[j].start;
	          				rows[i]['remaining'] = subscriptions[j].remaining;
	          				rows[i]['status'] = subscriptions[j].status;
	          				subscriptions[j].added = true;
	          				rows[i].save(function() {});
			    		}
		    	for (var i=0;i<subscriptions.length;i++) {
		    		if (subscriptions[i].added) continue;
          			// logger.log('performer[%s]: %s',i,JSON.stringify(subscriptions[i]));
          			sheet.addRow({
          				'_id':subscriptions[i]._id,
          				'performer':subscriptions[i].performer,
          				'fan':subscriptions[i].fan,
          				'price':subscriptions[i].price,
          				'start':subscriptions[i].start,
          				'remaining':subscriptions[i].remaining,
          				'status':subscriptions[i].status,
          			}, function() {});
          		}
	          	logger.log('Subscriptions saved to Kairos');
	          	callback(null);
        	});
        }], function(err) {
        	if (err.message.indexOf('EAI_AGAIN')>-1) return callback('Cannot Connect to Google');
        	if (err) callback(err.message);
        });
	},

	saveAllUsers : function(callback) {
		var self = this;
		var series = [];
		User.find({}, function (err, users) {
			if (err) logger.warn(err);
			logger.log('Saving User Subscriptions: %s', users.length);
			_.forEach(users, function (user) {
				series.push(function (next) {
					var user = users.shift();
					self.saveUserSubscriptions(user, function (err) {
						if (err) logger.warn(err);
						self.saveUserPayments(user, function (err) {
							if (err) logger.warn(err);
							self.saveUserPayouts(user, function (err) {
								if (err) logger.warn(err);
								next();
							});
						});
					});
				});
			});
			series.push(function (next) {
				logger.log('All Users Saved');
				callback(null);
			});
			async.series(series);
		});
	},

	saveAllPayments : function(callback) {
		var self = this;
		var series = [];
		User.find({}, function (err, users) {
			if (err) logger.warn(err);
			logger.log('Saving User Payments: %s', users.length);
			_.forEach(users, function (user) {
				series.push(function (next) {
					self.saveUserPayments(users.shift(), function (err) {
						if (err) logger.warn(err);
						next();
					});
				});
			});
			series.push(function (next) {
				logger.log('All User Payments Saved');
				callback(null);
			});
			async.series(series);
		});
	},

	saveAllPayouts : function(callback) {
		var self = this;
		var series = [];
		User.find({}, function (err, users) {
			if (err) loggeuserr.warn(err);
			logger.log('Saving User Payouts: %s', users.length);
			_.forEach(users, function (user) {
				series.push(function (next) {
					self.saveUserPayouts(users.shift(), function (err) {
						if (err) logger.warn(err);
						next();
					});
				});
			});
			series.push(function (next) {
				logger.log('All User Payouts Saved');
				callback(null);
			});
			async.series(series);
		});
	},

	saveAllSubscriptions : function(callback) {
		var self = this;
		var series = [];
		User.find({}, function (err, users) {
			if (err) logger.warn(err);
			logger.log('Saving User Subscriptions: %s', users.length);
			_.forEach(users, function (user) {
				series.push(function (next) {
					self.saveUserSubscriptions(users.shift(), function (err) {
						if (err) logger.warn(err);
						next();
					});
				});
			});
			series.push(function (next) {
				logger.log('All User Subscriptions Saved');
				callback(null);
			});
			async.series(series);
		});
	},

	saveUserSubscriptions : function(user, callback) {
		// gets sheet id for user
		// saves user's subscriptions / fans
		var self = this;
		logger.debug('Saving User Subscriptions to Sheets: %s',user.username);
		if (!user.google.spreadsheet_id) return callback('Missing Spreadsheet id: '+user.username);
		var doc = new GoogleSpreadsheet(user.google.spreadsheet_id);
		async.waterfall([
		  function setAuth(step) {
		    doc.useServiceAccountAuth(config.Google_Oauth_Opts, step);
		  },
		  function getInfoAndWorksheets(step) {
		    doc.getInfo(function (err, info) {
		      if (err) return callback(err);
		      logger.debug('Loaded sheet: '+info.title);
		      for (var i=0;i<info.worksheets.length;i++)
		      	if (info.worksheets[i].title=='subscriptions') 
		      		return step(null, info.worksheets[i]);
		    });
		  },
		  function getSubscriptions(sheet, step) {
		  	Subscription.find({ '$or':[{'performer': user._id },{'fan': user._id }]}, function (err, subscriptions) {
		  		if (err) logger.warn(err);
		  		// if (!subscriptions||subscriptions.length==0) return step({'message':'No subscriptions found!'});
		  		logger.debug('saving subs to user: %s -> %s',subscriptions.length, user.username);
		  		step(null, sheet, subscriptions);
  			});
		  },
		  function workingWithRows(sheet, subscriptions, step) {
		    sheet.getRows({
		      offset: 1,
		      // limit: 20,
		      orderby: 'col1',
		    }, function (err, rows) {
		    	if (err) return callback(err);
		    	rows = _.toArray(rows);
          		for (var i=0;i<rows.length;i++)
          			for (var j=0;j<subscriptions.length;j++) 
          				if (rows[i]['_id']==subscriptions[j]._id) {
					    	logger.debug('sub: %s <-- %s',subscriptions[j].performer,subscriptions[j].fan);
		          			rows[i]['fan'] = subscriptions[j].fan || "";
		          			rows[i]['start'] = subscriptions[j].start || "";
		          			rows[i]['remaining'] = subscriptions[j].remaining || "";
		          			rows[i]['price'] = subscriptions[j].price || "";
		          			rows[i]['status'] = subscriptions[j].status || "";
		      				subscriptions[j].added = true;
		      				rows[i].save(function() {});
		          		}
          		for (var i=0;i<subscriptions.length;i++) {
		    		if (subscriptions[i].added) continue;
			    	logger.debug('sub: %s <-- %s',subscriptions[i].performer,subscriptions[i].fan);
          			sheet.addRow({
          				'_id': subscriptions[i]._id || "",
          				'performer': subscriptions[i].performer || "",
          				'fan': subscriptions[i].fan || "",
          				'start': subscriptions[i].start || "",
          				'remaining': subscriptions[i].remaining || "",
          				'price': subscriptions[i].price || "",
          				'status': subscriptions[i].status || "",
          			}, function() {});
          		}
	          	logger.log('User subscriptions saved: %s', user.username);
	          	callback(null);
        	});
        }], function(err) {
        	if (err.message.indexOf('EAI_AGAIN')>-1) return callback('Cannot Connect to Google');
        	if (err) callback(err.message);
        });
	},

	saveUserPayments : function(user, callback) {
		var self = this;
		logger.debug('Saving User Payments to Sheets: %s',user.username);
		if (!user.google.spreadsheet_id) return callback('Missing Spreadsheet id: '+user.username);
		var doc = new GoogleSpreadsheet(user.google.spreadsheet_id);
		async.waterfall([
		  function setAuth(step) {
		    doc.useServiceAccountAuth(config.Google_Oauth_Opts, step);
		  },
		  function getInfoAndWorksheets(step) {
		    doc.getInfo(function (err, info) {
		      if (err) return step(err);
		      logger.debug('Loaded sheet: '+info.title);
		      for (var i=0;i<info.worksheets.length;i++)
		      	if (info.worksheets[i].title=='payments') 
		      		return step(null, info.worksheets[i]);
		    });
		  },
		  function getPayments(sheet, step) {
		  	Payment.find({ '$or':[{'performer': user._id },{'fan': user._id }]}, function (err, payments) {
		  		if (err) return step(err);
		  		// if (!payments||payments.length==0) return step({'message':'No payments found!'});
		  		logger.debug('saving payments to user: %s -> %s',payments.length,user.username);
		  		step(null, sheet, payments);
		  	})
		  },
		  function workingWithRows(sheet, payments, step) {
		    sheet.getRows({
		      offset: 1,
		      orderby: 'col1',
		    }, function (err, rows) {
		    	if (err) return callback(err);
		    	rows = _.toArray(rows);
		    	for (var i=0;i<rows.length;i++) 
		    		for (var j=0;j<payments.length;j++)
			    		if (rows[i]['_id']==payments[j]._id) {
			    			// logger.log('row found: %s',payments[j].subscriptions.length);
			    			rows[i]['fan'] = payments[j].fan;
			    			rows[i]['date'] = payments[j].date;
	          				rows[i]['time'] = payments[j].time;
	          				rows[i]['amount'] = payments[j].amount;
	          				rows[i]['fee'] = payments[j].fee;
	          				rows[i]['kairos_fee'] = payments[j].kairos_fee;
	          				rows[i]['net'] = payments[j].net;
	          				rows[i]['status'] = payments[j].status;
	          				payments[j].added = true;
	          				rows[i].save(function() {});
			    		}
		    	for (var i=0;i<payments.length;i++) {
		    		if (payments[i].added) continue;
          			// logger.log('performer[%s]: %s',i,JSON.stringify(payments[i]));
          			sheet.addRow({
          				'_id':payments[i]._id,
          				'performer':payments[i].performer,
          				'fan':payments[i].fan,
          				'date':payments[i].date,
          				'time':payments[i].time,
          				'amount':payments[i].amount,
          				'fee':payments[i].fee,
          				'kairos_fee':payments[i].kairos_fee,
          				'net':payments[i].net,
          				'status':payments[i].status
          			}, function() {});
          		}
	          	logger.log('User Payments saved: %s', user.username);
	          	callback(null);
        	});
        }], function(err) {
        	if (err.message.indexOf('EAI_AGAIN')>-1) return callback('Cannot Connect to Google');
        	if (err) callback(err.message);
        });
	},

	saveUserPayouts : function(user, callback) {
		var self = this;
		logger.debug('Saving User Payouts to Sheets: %s',user.username);
		if (!user.google.spreadsheet_id) return callback('Missing Spreadsheet id: '+user.username);
		var doc = new GoogleSpreadsheet(user.google.spreadsheet_id);
		async.waterfall([
		  function setAuth(step) {
		    doc.useServiceAccountAuth(config.Google_Oauth_Opts, step);
		  },
		  function getInfoAndWorksheets(step) {
		    doc.getInfo(function (err, info) {
		      if (err) return callback(err);
		      logger.debug('Loaded sheet: '+info.title);
		      for (var i=0;i<info.worksheets.length;i++)
		      	if (info.worksheets[i].title=='payouts') 
		      		return step(null, info.worksheets[i]);
		    });
		  },
		  function getPayouts(sheet, step) {
		  	Payout.find({ '$or':[{'performer': user._id },{'fan': user._id }]}, function (err, payouts) {
		  		if (err) return step(err);
		  		// if (!payouts||payouts.length==0) return step({'message':'No payouts found!'});
		  		logger.debug('saving payouts: %s',payouts.length);
		  		step(null, sheet, payouts);
		  	})
		  },
		  function workingWithRows(sheet, payouts, step) {
		    sheet.getRows({
		      offset: 1,
		      orderby: 'col1',
		    }, function (err, rows) {
		    	if (err) return callback(err);
		    	rows = _.toArray(rows);
		    	for (var i=0;i<rows.length;i++) 
		    		for (var j=0;j<payouts.length;j++)
			    		if (rows[i]['_id']==payouts[j]._id) {
			    			// logger.log('row found: %s',payouts[j].subscriptions.length);
			    			rows[i]['date'] = payouts[j].date;
	          				rows[i]['time'] = payouts[j].time;
	          				rows[i]['amount'] = payouts[j].amount;
	          				rows[i]['status'] = payouts[j].status;
	          				payouts[j].added = true;
	          				rows[i].save(function() {});
			    		}
		    	for (var i=0;i<payouts.length;i++) {
		    		if (payouts[i].added) continue;
          			// logger.log('performer[%s]: %s',i,JSON.stringify(payouts[i]));
          			sheet.addRow({
          				'_id':payouts[i]._id,
          				'performer':payouts[i].performer,
          				'date':payouts[i].date,
          				'time':payouts[i].time,
          				'amount':payouts[i].amount,
          				'status':payouts[i].status
          			}, function() {});
          		}
	          	logger.log('User Payouts saved: %s', user.username);
	          	callback(null);
        	});
        }], function(err) {
        	if (err.message.indexOf('EAI_AGAIN')>-1) return callback('Cannot Connect to Google');
        	if (err) callback(err.message);
        });
	},
}