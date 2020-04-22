var config = require('../config/index'),
    logger = config.logger,
    _ = require('underscore'),
    User = require('../models/user');

var occupancy = config.live_occupancy;
var num_occupants = 0;

module.exports.setup = function (io) {
	logger.io('Setting up socket.io');

	io.on('connection', function (client) {
		client._id = null;
		client.status = config.live_status;

		client.on('connected', function (userId) {
			// logger.io('connecting: %s', userId);
			client._id = userId;
			User.connected(userId, function (err) {
				if (err) logger.warn(err);
				clearInterval(client.SYNC_INTERVAL);
				client.SYNC_INTERVAL = setInterval(function () {
				    User.findById(client._id, function (err, user) {
				    	if (err) return logger.warn(err);
				    	if (!user) return logger.warn("Missing Sync User");
				        // add time
				        if (user.time_added) {  
			      	    	client.emit('time', {'time':user.time,'time_added':user.time_added});
				          	user.time_added = null;
				        }
				        if (user.address_added) {
				        	client.emit('address', {'address':user.address,'qrcode':user.address_qr});
				        	user.address_added = false;
				        	user.save();
				        }
				        // go live
				        if (config.live_status!=client.status) {
				        	client.status = config.live_status;
				        	client.emit('status', config.live_status);
				        }
				        // countdown on /live
				        user.countdown(function (err) {
				            if (err) {
				            	// logger.debug(err);
				            	return;
				            }
				            // out of time
			          		if (user.disconnect_me) {
			      				// logger.io('disconnecting: %s', user._id);
				  			  	client.emit('disconnect');
			      			}
				  			else {
				  				// logger.io('syncing: %s', user._id);
				  			  	client.emit('time', {'time':user.time});
				  			}
			      		});
				    });
			    }, config.syncInterval*1000);
			});
		});

		client.on('start', function () {
			// logger.io('starting: %s', client._id);
			User.start(client._id, function (err) {
				if (err) {
					// logger.debug(err);
					return;
				}
				num_occupants++;
				logger.io('Occupancy (+): %s', num_occupants);		
			});
		});

		client.on('stop', function () {
			// logger.io('stopping: %s', client._id);
			User.stop(client._id, function (err) {
				if (err) {
					// logger.debug(err);
					return;
				}
				num_occupants--;
				logger.io('Occupancy (-): %s', num_occupants);
			});
		});
		
		client.on('disconnect', function () {
			// logger.io('disconnecting: %s', client._id);
			User.disconnected(client._id, function (err) {
				if (err) logger.warn(err);
				clearInterval(client.SYNC_INTERVAL);
			});
		});

	});
}

module.exports.isRoom = function() {
	if (num_occupants>=occupancy) return false;
	return true;
}