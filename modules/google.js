var _ = require('underscore'),
	// GoogleSpreadsheet = require('google-spreadsheet'),
    config = require('../config/index.js'),
    logger = config.logger,
	async = require('async'),
    moment = require('moment');




function logTime(amount, timeAdded, time) {
	logger.log('GLogging: %s + %s (%s) = %s', time, timeAdded, amount, (time+timeAdded));
	// save to sheet

	// sheet stuff
	
	// if payment > $10 - $20 send email alert / render browser overlay animation probably in another function

	// email stuff
}
module.exports.logTime = logTime;