var config = require('../config/index'),
    logger = config.logger;

var User = require('../models/user');

var occupancy = 10;
var num_occupants = 0;

module.exports.setup = function (io) {
	logger.io('Setting up socket.io');

	io.on('connection', function (client) {
		num_occupants++;
		logger.io('Client connected: %s', num_occupants);
		if (num_occupants==1) User.syncOn();

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
			logger.io('Client disconnected: %s', num_occupants);
			if (num_occupants==0) User.syncOff();
		});

		client.on('end', function (userId) {
			logger.io('disconnecting: %s', userId);
			User.disconnected(userId, function (err) {
				if (err) logger.warn(err);
			});
		});

	});
}

module.exports.isRoom = function() {
	if (num_occupants>=occupancy) return false;
	return true;
}