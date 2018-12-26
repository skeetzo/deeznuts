var config = require('../config/index'),
    logger = config.logger,
    _ = require('underscore');

var User = require('../models/user');

var occupancy = 10;
var num_occupants = 0;

var clients = [];

module.exports.setup = function (io) {
	logger.io('Setting up socket.io');

	io.on('connection', function (client) {
		num_occupants++;
		logger.io('Client connected: %s', num_occupants);
		if (num_occupants==1) syncOn();

		// client.on('ballsacks', function (userId) {
		// 	logger.log('what the fuck');
		// 	logger.io('connecting: %s', userId);
		// 	User.connected(userId, function (err) {
		// 		if (err) return logger.warn(err);
		// 		clients.push([userId, client]);
		// 	});
		// });

		client.on('start', function (userId) {
			logger.io('starting: %s', userId);
			User.start(userId, function (err) {
				if (err) logger.warn(err);
				if (!_.contains(clients, userId))
					clients.push([userId, client]);
			});
		});

		client.on('stop', function (userId) {
			logger.io('stopping: %s', userId);
			User.stop(userId, function (err) {
				if (err) logger.warn(err);
			});
		});
		
		client.on('disconnect', function () {
			num_occupants--;
			logger.io('Client disconnected: %s', num_occupants);

			if (num_occupants==0) syncOff();
		});

		client.on('end', function (userId) {
			logger.io('ending: %s', userId);
			User.disconnected(userId, function (err) {
				if (err) logger.warn(err);
			});
			for (var i=0;i<clients.length;i++)
				if (clients[i]==userId)
					clients.splice(i,1);
		});



	});

	var SYNCING = false;
	var SYNC_INTERVAL;
	var redundant;
	var syncOff = function() {
	   clearTimeout(redundant);
	   redundant = setTimeout(function () {
	  	logger.log('Stopping User Syncs');
	    clearInterval(SYNC_INTERVAL);
	    SYNCING = false;
	  }, 10000);
	}

	var syncOn = function() {
	  clearInterval(SYNC_INTERVAL);
	  SYNCING = true;
	  logger.log('Starting User Syncs every %s second(s)...', config.syncInterval);
	  SYNC_INTERVAL = setInterval(function () {
	    User.find({'connected':true}, function (err, users) {
	      if (err) return logger.warn(err);
	      // logger.log('users: %s', users.length);
	      _.forEach(users, function (user) {
	      	logger.log(user);
	      	if (user.time_added) {  
	      		// logger.log('what the fucking fuck');
	          	for (var i=0;i<clients.length;i++)
	          		if (clients[i][0]==user._id)
	          			clients[i][1].emit('time', {'time':user.time,'time_added':user.time_added});
	          	user.time_added = null
	        }
	        user.sync(function (err) {
	          if (err) logger.warn(err);
	          if (user.disconnect) 
	          	for (var i=0;i<clients.length;i++)
	          		if (clients[i][0]==user._id)
	          			clients[i][1].emit('disconnect');
	        });
	      });
	    });
	  }, config.syncInterval*1000);
	}
}

module.exports.isRoom = function() {
	if (num_occupants>=occupancy) return false;
	return true;
}