var config = require('../config/index'),
	logger = config.logger,
	MongodbBackup = require('mongodb-backup'),
	moment = require('moment'),
    fss = require('fs-extra'),
    path = require('path');

var backupDatabase = function(callback) {
	logger.log('Backing Up MongoDB');
	if (!config.backup_db) return callback('Skipping MongoDB Backup');
	var year = moment(new Date()).format('YYYY');
	var month = moment(new Date()).format('MM-YYYY');
	var file_path = path.join(config.mnt_path, 'backups/mongo', year, month);
	// logger.debug('mongo backup path: %s/%s', file_path, moment(new Date()).format('MM-DD-YYYY')+'.tar');
	// logger.debug('file path: %s', file_path);
	fss.ensureDirSync(file_path);
	MongodbBackup({
	  uri: config.MONGODB_URI,
	  root: file_path,
	  // 'tar': moment(new Date()).format('MM-DD-YYYY')+'.tar',
	  'callback': function(err) {
	    if (err) return callback(err);
	    logger.log('MongoDB Backup Successful');
	    callback(null);
	  }
	});
}
module.exports.backupDatabase = backupDatabase;