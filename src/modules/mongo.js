var mongoose = require('mongoose'),
    session = require('express-session'),
    MongoDBStore = require('connect-mongodb-session')(session),
    config = require('../config/index'),
    logger = config.logger;

var redis = require('ioredis'),
    MongooseRedis = require('mongoose-with-redis'),
    redisClient = redis.createClient(config.REDIS_URL);

// squelch mpromise is deprecated warning
mongoose.Promise = global.Promise;
mongoose.useMongoClient = true;

const connection = mongoose.createConnection(config.MONGODB_URI);

mongoose.connect(config.MONGODB_URI,{
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
mongoose.connection.on('error',function (err) {  
  logger.debug('Mongoose connection error: ' + err);
}); 

var timeoutDelay = 3000;

// When the connection is disconnected
mongoose.connection.on('disconnected', function () {  
  logger.debug('Mongoose connection disconnected');
  logger.debug('Reconnecting to MongoDB in %s...',timeoutDelay);
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

module.exports = store;