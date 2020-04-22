var config = require('../config/index'),
    logger = config.logger,
    fs = require('fs'),
    fss = require('fs-extra'),
    moment = require('moment'),
    path = require('path');

var backup = function(callback) {
	var hours = moment(new Date()).format('HH');
	var minutes = moment(new Date()).format('mm');
	var year = moment(new Date()).format('YYYY');
	var month = moment(new Date()).format('MM-YYYY');
	var newLog = moment(new Date());
	// if time is within 10 minutes of midnight, set day back 1
	if (hours=="00"&&parseInt(minutes)<10)
		newLog.subtract(1, 'day')
	newLog = newLog.format('MM-DD-YYYY');
	var file_path = path.resolve(config.logs_dir, year, month);
	// logger.debug('logs backup path: %s', file_path);
	fss.ensureDir(file_path, function (err) {
	    if (err) return callback(err);
	  	logger.log('----- Logs Backed Up: %s -----', newLog);
	  	var backedUp = fs.readFileSync(config.logs_file).toString();
	  	// regex cleanup
	  	backedUp = backedUp.replace(/\[(1|3|2|4)(7|9|3|4|2|1|)m/gi,'');
	    fs.writeFile(file_path+"/"+newLog, backedUp, function (err) {
	    	if (err) console.error(err);
    		callback(null);	
		});
	});
}
module.exports.backup = backup;

var prepare = function() {
	if (fs.existsSync(config.logs_file)) return logger.log("Logs Found");
	fss.ensureDirSync("/var/log/apps");
	fss.ensureDirSync(config.logs_dir);
	fss.ensureFileSync(config.logs_file);
	logger.log('Logs Prepared');
}
module.exports.prepare = prepare;

var reset = function(callback) {
	logger.log('----- Resetting Logs -----');
	backup(function (err) {
		if (err) return callback(err);
		clear(function (err) {
			if (err) return callback(err);
			logger.log('----- Logs Reset: %s -----', moment(new Date()).format('MM-DD-YYYY'));
			callback(null);
		});
	});
}
module.exports.reset = reset;

var clear = function(callback) {
	fs.unlink(config.logs_file, function (err) {
        if (err) return callback(err);
        fss.ensureFileSync(config.logs_file);
        callback(null);
    });
}
module.exports.clear = clear;