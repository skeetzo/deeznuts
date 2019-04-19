var config = require('../config/index'),
    logger = config.logger,
    _ = require('underscore');

var User = require('../models/user');

var occupancy = 10;
var num_occupants = 0;

module.exports.setup = function (io) {
	logger.io('Setting up socket.io');

	io.on('connection', function (client) {
		client._id = null;

		client.on('connected', function (userId) {
			logger.io('connecting: %s', userId);
			User.connected(userId, function (err) {
				if (err) logger.warn(err);
				client._id = userId;
				num_occupants++;
				logger.io('Occupancy (+): %s', num_occupants);				
			});

			client.SYNC_INTERVAL = setInterval(function () {
			    User.findById(client._id, function (err, user) {
			    	if (err) return logger.warn(err);
			    	if (!user) return logger.warn("Missing Sync User");
			        if (user.time_added) {  
		      	    	client.emit('time', {'time':user.time,'time_added':user.time_added});
			          	user.time_added = null;
			        }
			        user.sync(function (err, synced) {
			            if (err) logger.warn(err);
			            if (!synced) return;
		          		if (user.disconnect) {
		      				logger.io('disconnecting: %s', user._id);
			  			  	client.emit('disconnect');
		      			}
			  			else {
			  				logger.io('syncing: %s', user._id);
			  			  	client.emit('sync', {'status':config.status,'time':user.time});
			  			}
		      		});
			    });
		    }, config.syncInterval*1000);
		});

		client.on('start', function (userId) {
			logger.io('starting: %s', userId);
			User.start(userId, function (err) {
				if (err) logger.warn(err);
			});
		});

		client.on('stop', function (userId) {
			logger.io('stopping: %s', userId);
			User.stop(userId, function (err) {
				if (err) logger.warn(err);
			});
		});
		
		client.on('disconnect', function () {
			logger.warn('this disconnect is doing something');
		});

		client.on('end', function (userId) {
			logger.io('ending: %s', userId);
			User.disconnected(userId, function (err) {
				if (err) logger.warn(err);
				num_occupants--;
				logger.io('Occupancy (-): %s', num_occupants);
				clearInterval(client.SYNC_INTERVAL);
			});
		});

	});
}

module.exports.isRoom = function() {
	if (num_occupants>=occupancy) return false;
	return true;
}