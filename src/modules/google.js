var _ = require('underscore'),
	// GoogleSpreadsheet = require('google-spreadsheet'),
    config = require('../config/index.js'),
    logger = config.logger,
	async = require('async'),
    moment = require('moment');




function logTime(value_in_satoshi, dollar, time, timeAdded) {
	logger.log('GLogging: %s seconds + %s seconds (%s satoshis -> %s dollars) = %s seconds', time, timeAdded, value_in_satoshi, dollar, (time+timeAdded));
	// save to sheet

	// sheet stuff
	
	// if payment > $10 - $20 send email alert / render browser overlay animation probably in another function

	// email stuff
}
module.exports.logTime = logTime;