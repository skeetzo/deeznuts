var config = require('../config/index'),
    logger = config.logger;

var occupancy = 10;
var num_occupants = 0;

module.exports.setup = function(io) {
	logger.io('Setting up socket.io');

	io.on('connection', function(client) {
		logger.io('Client Connected: %s', client);
		num_occupants++;

		client.on('chat message', function (msg) {
			io.emit('chat message', msg);
		});

		client.on('event', function(data) {

		});

		client.emit('request', function() {
			

		});

		client.on('reply', function() {

		});

		client.on('disconnect', function() {

		});



	  logger.io('Connection Successful!');
	});
}

module.exports.isRoom = function() {
	if (num_occupants>=occupancy) return false;
	return true;
}