var config = require('../config/index'),
    logger = config.logger;

var User = require('../models/user');

var occupancy = 10;
var num_occupants = 0;

module.exports.setup = function (io) {
	logger.io('Setting up socket.io');

	io.on('connection', function (client) {
		logger.io('Client Connected: %s', num_occupants);
		num_occupants++;

		client.on('connecting', function (userId) {
			logger.io('connecting: %s', userId);
			User.connected(userId, function (err) {
				if (err) return logger.warn(err);
				sync(userId);
			});
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
			num_occupants--;
		});

		client.on('end', function (userId) {
			logger.io('disconnecting: %s', userId);
			User.disconnected(userId, function (err) {
				if (err) logger.warn(err);
			});
		});

		// function sync(userId) {
		// 	setInterval(function () {
		// 		client.emit('sync', config.status);
		// 		User.findById(userId, function (err, user) {
		// 			if (err) return logger.warn(err);
		// 			if (user.disconnect) client.emit('disconnect');
		// 		});
		// 	}, config.syncInterval*1000);
		// }

	});
}

module.exports.isRoom = function() {
	if (num_occupants>=occupancy) return false;
	return true;
}

// clearTimeout(user.syncTimer);
// user.syncTimer = setInterval(function () {
// 	logger.log('user synced: %s -> %s', user.time,(user.time - (config.syncInterval/1000)));
// 	user.time = user.time - (config.syncInterval/1000);
// 	user.save(function (err) {
// 		if (err) logger.warn(err);
// 		if (user.time<=0) client.emit('timeout', userId);
// 	});
// }, config.syncInterval);