var config = require('../config/index'),
    logger = config.logger,
    fs = require('fs'),
    fss = require('fs-extra'),
    moment = require('moment'),
    async = require('async'),
    path = require('path'),
    zlib = require('zlib'),
    fstream = require('fstream'),
    tar = require('tar'),
    _ = require('underscore');

var Log = function() {

}

Log.prototype.backup = function(callback) {
	// write to dev logs backup
	var newLog = moment(new Date()).format('MM-DD-YYYY');
	var year = moment(new Date()).format('YYYY');
	var month = moment(new Date()).format('MM-YYYY');
	var file_path = path.resolve(config.logs_dir, year, month);
	// logger.log('logs backup path: %s', file_path);
	fss.ensureDir(file_path, err => {
	    if (err) return callback(err);
	  	// dir has now been created, including the directory it is to be placed in
	  	logger.log('----- Logs Backed Up: %s -----', newLog);
  		// read log file text
	  	var backup = fs.readFileSync(config.logs_file).toString();
	  	// regex cleanup
	  	backup = backup.replace(/\[(1|3|2|4)(7|9|3|4|2|1|)m/gi,'');
	    fs.writeFile(file_path+"/"+newLog, backup, function (err) {
	    	if (err) console.error(err);
	    	try {
				fstream.Reader({ 'path': config.logs_dir, 'type': 'Directory' }) /* Read the source directory */
				.on('end', function () {
					logger.debug('Logs Compressed');
					callback(null);
				})
				.on('error', function (err) {
					if (err&&err.message) logger.warn(err.message);
				})
				.pipe(tar.Pack()) /* Convert the directory to a .tar file */
				.pipe(zlib.Gzip()) /* Compress the .tar file */
				.pipe(fstream.Writer({ 'path': path.resolve(config.logs_dir, "logs.tar.gz") })) /* Give the output file name */
			}
			catch (err) {
				logger.warn(err);
				callback(null);
			}
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
	fs.unlink(config.logs_file, function (err) {
        if (err) logger.warn(err);
        fss.ensureFileSync(config.logs_file);
        console.log('Logs Cleared');
        callback(null);
    });
}

var log = new Log();
module.exports = log;