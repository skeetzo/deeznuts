var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    moment = require('moment'),
    config = require('../config/index'),
    logger = config.logger,
    _ = require('underscore'),
    async = require('async'),
    Google = require('../modules/google'),
    Receive = require('blockchain.info/Receive'),
    bcrypt = require('bcrypt-nodejs'),
    Transaction = require('../models/transaction'),
    Video = require('../models/video'),
    QRCode = require('qrcode');

// User Schema
var userSchema = new Schema({
  address: { type: String },
  address_qr: { type: String },
  access_token: { type: String },
  refresh_token: { type: String },
  ip: { type: String },
  ips: { type: Array, default: [] },
  lastVisit: { type: Date, default: moment(new Date()).format('MM/DD/YYYY') },
  logins: { type: Number, default: 0 },
  password: { type: String },
  secret : { type: String }, // crypto sig
  syncing : { type: Boolean, default: false },
  start_date: { type: String, default: moment(new Date()).format('MM/DD/YYYY') },
  time: { type: Number, default: config.defaultTime }, // time allotted for live
  time_added: { type: Number },
  transactions: { type: Array, default: [] },
  username: { type: String },
  videos: { type: Array, default: [] }
});

userSchema.pre('save', function (next) {
  var self = this;
  if (!self.ip||self.isModified('ip')||self.isModified('ips')) {
    var i = 0;
    self.ip = self.ips[i];
    while (self.ip=='unknown'&&i<self.ips.length) {
      self.ip = self.ips[i];
      i++;
    }
  }
  if (!self.isModified('password')) return next();
  var SALT_FACTOR = 5;
  bcrypt.genSalt(SALT_FACTOR, function(err, salt) {
    if (err) return next(err);
    bcrypt.hash(self.password, salt, null, function(err, hash) {
      if (err) return next(err);
      self.password = hash;
      next();
    });
  });
});

userSchema.statics.connected = function (userId, callback) {
  User.findById(userId, function (err, user) {
    if (err) return callback(err);
    if (!user) return callback('Missing User: '+userId);
    user.connect(function (err) {
      callback(err);
    });
  });
}

userSchema.statics.disconnected = function (userId, callback) {
  User.findById(userId, function (err, user) {
    if (err) return callback(err);
    if (!user) return callback('Missing User: '+userId);
    user.disconnect(function (err) {
      callback(err);
    });
  }); 
}

userSchema.statics.start = function (userId, callback) {
  User.findById(userId, function (err, user) {
    if (err) return callback(err);
    if (!user) return callback('Missing User: '+userId);
    user.start(function (err) {
      callback(err);
    });
  });
}

userSchema.statics.stop = function (userId, callback) {
  User.findById(userId, function (err, user) {
    if (err) return callback(err);
    if (!user) return callback('Missing User: '+userId);
    user.stop(function (err) {
      callback(err);
    });
  });
}

userSchema.statics.generateAddress = function(userId, callback) {
  logger.log('Generating Address: %s', userId);
  async.waterfall([
    function (step) {
      User.findById(userId, function (err, user) {
        if (err) return callback(err);
        if (user.address) return callback('Live Address already generated: '+user._id);
        step(null, user);
      });
    },
    function (user, step) {
      // Generate new blockchain address
      var xpub = config.blockchain_xpub,
        cb = config.blockchain_callback,
        key = config.blockchain_key,
        options = {};
      // myReceive is the blockchain Object for the new address's generation
      var myReceive = new Receive(xpub, cb, key, options);
      // this checks the gap or number of unused addresses that have been generated
      // gap - the current address gap (number of consecutive unused addresses)
      if (config.debugging_blockchain||!config.blockchain_check_gap) return step(null, user, myReceive);
      logger.debug('checking blockchain gap...');
      var checkgap = myReceive.checkgap()
      .then(function (data) {
        logger.debug('gap: %s', data.gap);
        if (data.gap>config.blockchainGapLimit) {
          options = {
            '__unsafe__gapLimit':config.blockchain_gap_limit
          };
          myReceive = new Receive(xpub, cb, key, options);
          logger.log('gap chain limit reached: '+data.gap);
          logger.debug('gap chain limit raised: %s', config.blockchain_gap_limit);
          config.blockchain_check_gap = false;
        }
        step(null, user, myReceive);
      });
    },
    function (user, myReceive, step) {
      // generate address
      var timestamp = (Date.now() + 3600000);
      var hash = require('md5')(timestamp+"-"+config.blockchainHash);
      if (config.debugging_blockchain) hash = config.blockchainHash;
      user.secret = hash;
      var query = {'secret':hash};
      // logger.debug('query: %s', JSON.stringify(query, null, 4));
      if (config.debugging_blockchain) return step(null, user, config.debugging_blockchain_address); 
      myReceive = myReceive.generate(query)
      .then(function (generated) {
        logger.debug('generated: %s', JSON.stringify(generated));
        step(null, user, generated.address);
      });
    },
    function (user, address, step) {
      QRCode.toDataURL(address, function (err, url) {
        if (err) logger.warn(err);
        // logger.debug('qrcode: %s', url);
        step(null, user, address, url);
      });
    },
    function (user, address, url, step) {
      user.address_qr = url;
      user.address = address;
      user.save(function (err) {
        if (err) return step(err);
        logger.debug('BTC address created');
        callback(null);
      });
    }
    ], function (err) {
      callback(err);
  });
}

userSchema.statics.sync = function() {
  User.find({'syncing':true}, function (err, users) {
    if (err) return logger.warn(err);
    _.forEach(users, function (user) {
      user.sync(function (err) {
        if (err) logger.warn(err);
      });
    });
  });
}

// amount in satoshi, so divide by 100,000,000 to get the value in BTC
userSchema.methods.addTime = function(value_in_dollars, callback) {
	var self = this;
  logger.log('Calculating time: %s dollars', value_in_dollars);
  var timeAdded = value_in_dollars*(config.conversionRate*60); // 6 minutes per dollar
  logger.debug('dollar to seconds: $%s -> %s seconds', value_in_dollars, timeAdded);
  logger.log('Time Added: %s seconds + %s seconds = %s seconds', self.time, timeAdded, (self.time+timeAdded));
  // Google.logTime(value_in_satoshi, dollar, self.time, timeAdded);
  self.time_added = timeAdded;
  self.time+= timeAdded;
  self.save(function (err) {
    callback(err);
  });
}

userSchema.methods.connect = function(callback) {
  var self = this;
  if (self.connected) return callback('Error: User already connected');
  self.connected = true;
  self.save(function (err) {
    if (err) return callback(err);
    logger.log('connected: %s', self._id);
    callback(null);
  });
}

userSchema.methods.disconnect = function(callback) {
  var self = this;
  if (!self.connected) return callback('Error: User not connected');
  self.connected = false;
  self.save(function (err) {
    if (err) return callback(err);
    logger.log('disconnected: %s', self._id);
    callback(null);
  });
}

// find video and duration
// if self.time > duration
// purchase video
// else return error: missing time %s amount
userSchema.methods.purchaseVideo = function(videoTitle, callback) {
  var self = this;
  logger.log('Purchasing Video: %s -> %s', self._id, videoTitle);
  async.waterfall([
    function (step) {
      require('../models/video').findOne({'title':videoTitle,'isOriginal':true}, function (err, video) {
        if (err) return step(err);
        if (!video) return step('Error Purchasing Video: Missing Video: '+videoTitle);
        step(null, video);
      });
    },
    function (video, step) {
      logger.debug('self.time: %s', parseInt(self.time, 10));
      logger.debug('video.duration: %s', parseInt(video.duration, 10));
      if (parseInt(self.time, 10)<parseInt(video.duration, 10)) {
        return callback('Error Purchasing Video: Not Enough Time', parseInt(video.duration, 10)-parseInt(self.time, 10))
      }
      self.videos.push(video._id);
      logger.debug('self.time: %s - %s = %s', parseInt(self.time, 10), parseInt(video.duration, 10), parseInt(self.time, 10)-parseInt(video.duration, 10));
      self.time = parseInt(self.time, 10)-parseInt(video.duration, 10);
      logger.log('Video Purchaed: %s -> %s', video.title, self._id);
      video.sendPurchasedEmail(function (err) {
        if (err) logger.warn(err);
      });
      self.save(function (err) {
        callback(err, "Video Purchased!");
      });
    }
    ], function (err) {
      callback(err);
  });
}

userSchema.methods.sync = function (callback) {
  var self = this;
  // logger.debug('syncing user: %s - %s = %s', parseInt(self.time, 10), parseInt(config.syncInterval, 10), parseInt(self.time, 10) - parseInt(config.syncInterval, 10));
  self.time = parseInt(self.time, 10) - parseInt(config.syncInterval, 10);
  if (self.time<=0) 
    self.disconnect = true;
  self.save(function (err) {
    callback(err);
  });
}

userSchema.methods.start = function (callback) {
  var self = this;
  // logger.debug('starting : %s', self._id);
  self.syncing = true;
  self.save(function (err) {
    if (err) return callback(err);
    logger.debug('started: %s', self._id);
    callback(null);
  });
}

userSchema.methods.stop = function (callback) {
  var self = this;
  // logger.debug('stopping : %s', self._id);
  self.syncing = false;
  self.save(function (err) {
    if (err) return callback(err);
    logger.debug('stopped: %s', self._id);
    callback(null);
  });
}

userSchema.methods.verifyPassword = function(candidatePassword, callback) {
  bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
    callback(err, isMatch);
  });
};

var User = mongoose.model('users', userSchema,'users');
module.exports = User;
