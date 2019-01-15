var config = require('../config/index'),
	logger = config.logger,
	backup = require('mongodb-backup'),
	moment = require('moment'),
    fss = require('fs-extra'),
    path = require('path'),
    async = require('async');

var backupDatabase = function(callback) {
	logger.log('Backing Up MongoDB: %s', config.botName);
	var year = moment(new Date()).format('YYYY');
	var month = moment(new Date()).format('MM-YYYY');
	var file_path = path.join(config.mnt_path, 'backups/mongo', year, month);
	// logger.debug('mongo backup path: %s/%s', file_path, moment(new Date()).format('MM-DD-YYYY')+'.tar');
	// logger.debug('file path: %s', file_path);
	fss.ensureDirSync(file_path);
	backup({
	  uri: config.MONGODB_URI,
	  root: file_path,
	  tar: moment(new Date()).format('MM-DD-YYYY')+'.tar',
	  callback: function(err) {
	    if (err) return callback(err);
	    logger.log('MongoDB Backup Successful');
	    callback(null);
	  }
	});
}
module.exports.backupDatabase = backupDatabase;

var backupApp = function(callback) {
	logger.log('Backing Up App: %s', config.botName);
	fstream.Reader({ 'path': config.mnt_path, 'type': 'Directory' }) /* Read the source directory */
	.on('end', function () {
		logger.debug('Logs Compressed');
		callback(null);
	})
	.on('error', function (err) {
		if (err&&err.message) logger.warn(err.message);
	})
	.pipe(tar.Pack()) /* Convert the directory to a .tar file */
	.pipe(zlib.Gzip()) /* Compress the .tar file */
	.pipe(fstream.Writer({ 'path': path.join(config.mnt_path, "backups", config.botName+".tar.gz") })) /* Give the output file name */
}
module.exports.backupApp= backupApp;

var backup = function(callback) {
	async.series([
		function (step) {
			backupDatabase(function (err) {
				if (err) logger.warn(err);
				step(null);
			});
		},
		function (step) {
			backupApp(function (err) {
				if (err) logger.warn(err);
				callback(null);
			});
		}
	]);
}
module.exports.backup = backup;