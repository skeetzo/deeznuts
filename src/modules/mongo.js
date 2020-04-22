var config = require('../config/index'),
    logger = config.logger;
    mongoose = require('mongoose'),
    session = require('express-session'),
    MongoDBStore = require('connect-mongodb-session')(session),
    MongodbBackup = require('mongodb-backup'),
    moment = require('moment'),
    fss = require('fs-extra'),
    path = require('path');

if (config.database_redis)
  var redis = require('ioredis'),
      MongooseRedis = require('mongoose-with-redis'),
      redisClient = redis.createClient(config.REDIS_URL);

// squelch mpromise is deprecated warning
mongoose.Promise = global.Promise;
mongoose.useMongoClient = true;

const connection = mongoose.createConnection(config.MONGODB_URI);

mongoose.connect(config.MONGODB_URI, {
  server: {
    socketOptions: {
      ssl: 'prefer',
      socketTimeoutMS: 0,
      connectionTimeout: 0
    },
    reconnectTries: 3,
    reconnectInterval: 6000,
  },
});

var cacheOptions = {
  cache: true,
  expires: 60*10,
  prefix: 'RedisCache'
};

if (config.database_redis)
  MongooseRedis(mongoose, redisClient, cacheOptions);

var store = new MongoDBStore(
  {
    uri: config.MONGODB_URI,
    collection: 'sessions',
    auto_reconnect: true,
    mongooseConnection: connection,
  });

// CONNECTION EVENTS
// When successfully connected
mongoose.connection.on('connected', function () {  
  logger.debug('Mongoose connection open');
}); 

// If the connection throws an error
mongoose.connection.on('error', function (err) {  
  logger.debug('Mongoose connection error: ' + err);
}); 

var timeoutDelay = 3000;

// When the connection is disconnected
mongoose.connection.on('disconnected', function () {  
  logger.debug('Mongoose connection disconnected');
  logger.debug('Reconnecting to MongoDB in %s...', timeoutDelay);
  setTimeout(function() {
    timeoutDelay+=3000;  
    mongoose.connect(config.MONGODB_URI);
  },timeoutDelay);
});

// If the Node process ends, close the Mongoose connection 
process.on('SIGINT', function() {  
  mongoose.connection.close(function () { 
    logger.debug('Mongoose connection disconnected through app termination'); 
    process.exit(0); 
  }); 
}); 

module.exports.store = store;

var backup = function(callback) {
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
module.exports.backup = backup;