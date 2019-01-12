var config = require('../config/index'),
	logger = config.logger,
	backup = require('mongodb-backup'),
	moment = require('moment'),
    fss = require('fs-extra'),
    path = require('path');

module.exports.backup = function(callback) {
	logger.log('Backing Up MongoDB: %s', config.botName);
	var year = moment(new Date()).format('YYYY');
	var month = moment(new Date()).format('MM-YYYY');
	var file_path = path.join(config.dev_path, 'mongo', year, month);
	// logger.debug('mongo backup path: %s/%s', file_path, moment(new Date()).format('DD-MM-YYYY')+'.tar');
	fss.ensureDirSync(file_path);
	backup({
	  uri: config.MONGODB_URI,
	  root: file_path,
	  tar: moment(new Date()).format('DD-MM-YYYY')+'.tar',
	  callback: function(err) {
	    if (err) return callback(err);
	    logger.log('MongoDB Backup Successful');
	    callback(null);
	  }
	});
}