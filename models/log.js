var config = require('../config/index'),
    logger = config.logger,
    fs = require('fs'),
    fss = require('fs-extra'),
    moment = require('moment'),
    async = require('async'),
    _ = require('underscore');


// config.logger_log_path


var Log = function() {

}

Log.prototype.backup = function(callback) {
	// write to dev logs backup
	var newLog = moment(new Date()).format('MM-DD-YYYY');
	fss.ensureDir('./dev/logs/backup', err => {
	    if (err) return callback(err);
	  	// dir has now been created, including the directory it is to be placed in
	  	logger.log('----- Logs Backed Up: %s -----', newLog);
  		// read log file text
	  	var backup = fs.readFileSync(config.logger_log_path).toString();
	    fs.writeFile('./dev/logs/backup/'+newLog, backup, function (err) {
	    	if (err) console.error(err);
			callback(null);
		});
	});
}

Log.prototype.reset = function(callback) {
	logger.log('----- Resetting Logs -----');
	log.backup(function (err) {
		if (err) return callback(err);
		log.clear(function (err) {
			if (err) return callback(err);
			console.log('Logs Reset');
			logger.log('----- Logs Reset: %s -----', moment(new Date()).format('MM-DD-YYYY'));
			callback(null);
		});
	});
}

Log.prototype.clear = function(callback) {
	fs.unlink('./dev/logs/file.log', function (err) {
        if (err) logger.warn(err);
        console.log('Logs Cleared');
        fss.ensureFileSync(config.logger_log_path);
        callback(null);
    });
}

var log = new Log();
module.exports = log;