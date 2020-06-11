var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    moment = require('moment'),
    config = require('../config/index'),
    logger = config.logger,
    _ = require('underscore'),
    async = require('async'),
    // Google = require('../modules/google'),
    Receive = require('blockchain.info/Receive'),
    bcrypt = require('bcrypt-nodejs'),
    Transaction = require('../models/transaction'),
    Video = require('../models/video');

// User Schema
var userSchema = new Schema({
  address: { type: String },
  address_qr: { type: String },
  address_added: { type: Boolean, default: false },
  lastVisit: { type: Date, default: moment(new Date()).format('MM/DD/YYYY') },
  logins: { type: Number, default: 0 },
  password: { type: String },
  start_date: { type: String, default: moment(new Date()).format('MM/DD/YYYY') },
  time: { type: Number, default: config.defaultTime }, // time allotted for live
  time_added: { type: Number },

  username: { type: String },
  videos: { type: Array, default: [] },
  countingDown: { type: Boolean, default: false },
  connected: { type: Boolean, default: false },

  deactivated: { type: Boolean, default: false },
  deactivatesOn: { type: String }
 });

userSchema.pre('save', function (next) {
  var self = this;
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

userSchema.statics.deactivateOldUsers = function(callback) {
  logger.remove('Deactivating Old Users');
  // if deactivated and expired or unverified and oldder than 30 days
  this.find( {'lastVisit': { '$gt': Date.now()+(1000*60*60*24*30)}}, function (err, users) {
    if (err) return callback(err);
    if (!users||users.length==0) {
      logger.remove('No users to deactivate!');
      return callback(null);
    }
    logger.debug('Old Accounts: %s',_.pluck(users,'_id').join(', '));
    var series = [];
    _.forEach(users, function (user) {
      series.push(function (step) {
        user.deactivate(function (err) {
          if (err) logger.warn(err);
          step(null);
        });
      });
    })
    series.push(function (step) {
      callback(null);
    });
    async.series(series);
  });
};

userSchema.statics.deleteOldUsers = function(callback) {
  logger.remove('Deleting Old Deactivated Users');
  // if deactivated and older than 30 days
  this.find( { '$or': [ {'deactivated': true, 'deactivatesOn': { '$lt': Date.now() } } ] }, function (err, users) {
    if (err) return callback(err);
    if (!users||users.length==0) {
      logger.remove('No users to delete!');
      return callback(null);
    }
    logger.debug('Old Accounts: %s',_.pluck(users,'_id').join(', '));
    var series = [];
    _.forEach(users, function (user) {
      series.push(function (step) {
        user.delete(function (err) {
          if (err) logger.warn(err);
          step(null);
        });
      });
    })
    series.push(function (step) {
      callback(null);
    });
    async.series(series);
  });
};

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
  User.findById(userId, function (err, user) {
    if (err) return callback(err);
    var BCoin_Wallet = require('../modules/bcoin-wallet');
    BCoin_Wallet.getAddress(function (err, address) {
      if (err) return callback(err);
      user.address = address;
      BCoin_Wallet.createQR(address, function (err, url) {
        if (err) logger.warn(err);
        else user.address_qr = url;
        user.address_added = true;
        user.save(function (err) {
          if (err) return step(err);
          logger.debug('BTC address created');
          callback(null);
        });
      });
    });
  })
}

// amount in satoshi, so divide by 100,000,000 to get the value in BTC
userSchema.methods.addTime = function(value_in_dollars, callback) {
  var self = this;
  // logger.log('Calculating time: %s dollars', value_in_dollars);
  var timeAdded = value_in_dollars*config.conversionRate;
  logger.debug('dollar to seconds: $%s -> %s seconds', value_in_dollars, timeAdded);
  logger.log('Time Added: %s seconds + %s seconds = %s seconds', self.time, timeAdded, (self.time+timeAdded));
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
    // logger.log('connected: %s', self._id);
    callback(null);
  });
}

userSchema.methods.disconnect = function(callback) {
  var self = this;
  if (!self.connected) return callback('Error: User not connected');
  self.connected = false;
  self.save(function (err) {
    if (err) return callback(err);
    // logger.log('disconnected: %s', self._id);
    callback(null);
  });
}

userSchema.methods.deactivate = function(callback) {
  var self = this;
  logger.log('Deactivating User: %s', self._id);
  self.deactivated = true;
  self.deactivatesOn = Date.now() + 1000*60*60*24*30;
}

userSchema.methods.delete = function(callback) {
  var self = this;
  if (!self.deactivated) return callback('Error Deleting: User is not deactivated - '+self._id);
  logger.remove('Deleting User: %s', self._id);
  User.remove({'_id':self._id}, function (err) {
    if (err) return callback(err);
    logger.remove('User Deleted: %s',self._id);
    callback(null);
  });  
}

// find video and duration
// if self.time > duration
// purchase video
// else return error: missing time %s amount
userSchema.methods.purchaseVideo = function(videoId, callback) {
  var self = this;
  logger.log('Purchasing Video: %s -> %s', self._id, videoId);
  async.waterfall([
    function (step) {
      Video.findOne({'_id':videoId,'isOriginal':true}, function (err, video) {
        if (err) return step(err);
        if (!video) return step('Error Purchasing Video: Missing Video: '+videoId);
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
      logger.log('Video Purchased: %s -> %s', video.title, self._id);
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

userSchema.methods.countdown = function (callback) {
  var self = this;
  if (!self.countingDown) return callback("Not Counting Down: "+self._id);
  // logger.debug('syncing user (%s): %s - %s = %s', self._id, parseInt(self.time, 10), parseInt(config.syncInterval, 10), parseInt(self.time, 10) - parseInt(config.syncInterval, 10));
  self.time = parseInt(self.time, 10) - parseInt(config.syncInterval, 10);
  if (self.time<=0) self.disconnect_me = true;
  else self.disconnect_me = false;
  self.save(function (err) {
    callback(err);
  });
}

userSchema.methods.start = function (callback) {
  var self = this;
  if (self.countingDown) return callback("Already Started: "+self._id);
  self.countingDown = true;
  self.save(function (err) {
    if (err) return callback(err);
    // logger.debug('started: %s', self._id);
    callback(null);
  });
}

userSchema.methods.stop = function (callback) {
  var self = this;
  if (!self.countingDown) return callback("Already Stopped: "+self._id);
  self.countingDown = false;
  self.save(function (err) {
    if (err) return callback(err);
    // logger.debug('stopped: %s', self._id);
    callback(null);
  });
}

userSchema.methods.sync = function (callback) {
  this.countdown(function (err) {
    if (err) logger.warn(err);
    callback(null, true);
  });
}

userSchema.methods.verifyPassword = function(candidatePassword, callback) {
  bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
    callback(err, isMatch);
  });
};

userSchema.set('redisCache', true);
var User = mongoose.model('users', userSchema, 'users');
module.exports = User;