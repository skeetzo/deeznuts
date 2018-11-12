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
  addresses: { type: Array, default: [String] },
  address_qr: { type: String },
  ip: { type: String },
  ips: { type: Array, default: [] },
  lastVisit: { type: Date, default: moment(new Date()).format('MM/DD/YYYY') },
  logins: { type: Number, default: 0 },
  password: { type: String },
  // qr: { type: String },
  // secret : { type: String }, // crypto sig
  secrets : { type: Array, default: [String] }, // crypto sigs
  start: { type: String, default: moment(new Date()).format('MM/DD/YYYY') },
  time: { type: Number, default: config.defaultTime }, // time allotted for live
  time_added: { type: Number },
  transactions: { type: Array, default: [] },
  username: { type: String },
  videos: { type: Array, default: [] },
  video_added: { type: String }
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

userSchema.statics.generateAddress = function(data, callback) {
  logger.log('Generating Address: %s|%s', data._id, data.reason);
  async.waterfall([
    function (step) {
      User.findById(data._id, function (err, user) {
        if (err) return callback(err);
        if (data.reason=='live'&&user.address) return callback('Live Address already generated: '+user._id);
        step(null, user);
      });
    },
    function (user, step) {
      // Generate new blockchain address
      var xpub = config.blockchain_xpub,
        cb = config.blockchain_callback,
        key = config.blockchain_key,
        options = {
          '__unsafe__gapLimit':config.blockchain_gap_limit
        };
      // myReceive is the blockchain Object for the new address's generation
      var myReceive = new Receive(xpub, cb, key, options);
      step(null, user, myReceive);
    },
    function (user, myReceive, step) {
      // this checks the gap or number of unused addresses that have been generated
      // gap - the current address gap (number of consecutive unused addresses)
      if (config.debugging_blockchain||!config.blockchain_check_gap) return step(null, user, myReceive);
      logger.debug('checking blockchain gap...');
      var checkgap = myReceive.checkgap()
      .then(function (data) {
        logger.debug('gap: %s', data.gap);
        if (data.gap>config.blockchainGapLimit) 
          return step('gap chain limit reached: '+data.gap);
        step(null, user, myReceive);
      });
    },
    function (user, myReceive, step) {
      // generate address
      var timestamp = (Date.now() + 3600000);
      var hash = require('md5')(timestamp+"-"+config.blockchainHash);
      if (config.debugging_blockchain) hash = config.blockchainHash;
      // user.secret = hash;
      user.secrets.push(hash);
      var query = {'secret':hash,'transaction':data.reason};
      if (data.reason=='live') {
        step(null, user, myReceive, query, null);
      }
      else if (data.reason=='vod') {
        Video.findOne({'title':data.video,'isOriginal':true,'hasPreview':true}, function (err, video) {
          if (err) return step(err);
          if (!video) return step('Missing video');
          query.video = video._id;
          step(null, user, myReceive, query, video);
        });
      }
    },
    function (user, myRecieve, query, video, step) {
      logger.debug('query: %s', JSON.stringify(query, null, 4));
      if (config.debugging_blockchain) return step(null, user, config.debugging_blockchain_address, video); 
      myReceive = myReceive.generate(query)
      .then(function (generated) {
        logger.debug('generated: %s', JSON.stringify(generated));
        step(null, user, generated.address, video);
      });
    },
    function (user, address, video, step) {
      QRCode.toDataURL(address, function (err, url) {
        if (err) logger.warn(err);
        // logger.debug('qrcode: %s', url);
        step(null, user, address, video, url);
      });
    },
    function (user, address, video, url, step) {
      if (data.reason=='vod') {
        var video = new Video(video);
        video.isOriginal = false;
        video.address = address;
        video.address_qr = url;
        user.addresses.push(address);
        video.save(function (err) {
          if (err) return step(err);
          // user.videos.push(video._id);
          step(null, user);
        });
      }
      else {
        user.address_qr = url;
        user.address = address;
        step(null, user)
      }
    },
    function (user, address, step) {
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

userSchema.statics.sync = function(data, callback) {
  // logger.debug('Syncing: %s', data._id);
  User.findById(data._id, function (err, user) {
    if (err) return callback(err);
    if (!user) return 'User not found: '+data._id;
    if (Math.abs(parseInt(user.time)-parseInt(data.time))>9&&config.debugging_sync)
      logger.debug('syncing (ignore): %s seconds -> %s seconds (%s)', user.time, data.time, data._id);
    else if (data.time<=0) {
      if (config.debugging_sync)
        logger.debug('syncing (bug): %s seconds -> %s (%s) seconds (%s)', user.time, 0, data.time, data._id);
      user.time = 0;
    }
    else {
      if (config.debugging_sync)
        logger.debug('syncing (success): %s seconds -> %s seconds (%s)', user.time, data.time, data._id);
      user.time = data.time;
    }
    var time_added = user.time_added || false;
    user.time_added = null;
    var video_added = user.video_added || false;
    user.video_added = null;
    user.save(function (err_) {
      callback(err_,{'time':user.time,'time_added':time_added,'video_added':video_added,'status':config.status});
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


userSchema.methods.addVideoTransaction = function(transaction, callback) {
  var self = this;
  async.waterfall([
    // find original video for reference
    function (step) {
      Video.findById(transaction.video, function (err, video) {
        if (err) return step(err);
        if (!video) return step('Error Adding Video: Missing Original Video');
        step(null, video);
      });
    },
    // if video has already been copied find it
    function (original, step) {
      // check for existing paid video
      Video.findOne({'title':original.title,'isOriginal':false,'_id':{'$in':self.videos}}, function (err, video) {
        if (err) return step(err);
        // if video hasn't been copied, copy it
        if (!video) {
          logger.debug('creating new video: %s', original.title);
          video = new Video(original);
          video.isOriginal = false;
          self.videos.push(video._id);
          video.save(function (err) {
            step(err, video);
          });
        }
        else
          step(null, video);
      });
    },
    function (video, step) {
      video.addTransaction(transaction, function (err) {
        if (err) return step(err);
        if (video.isPaid)
          self.video_added = video._id;
        step(null);
      });
    }
  ], function (err) {
      if (err) logger.warn(err);
      self.save(function (err) {
        callback(err);
      });
    });
}

userSchema.methods.verifyPassword = function(candidatePassword, callback) {
  bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
    callback(err, isMatch);
  });
};

var User = mongoose.model('users', userSchema,'users');
module.exports = User;

// var options = {
//   'time': (new Date()).getTime()
// };
// Exchange.toBTC(value_in_btc, 'USD', options)
// .then(function (data) {
//   logger.log('amount in USD: %s', data);
//   logger.log('data: %s', data);
//   logger.log('data: %s', JSON.stringify(data, null, 4));
// });
// Exchange.toBTC(value_in_satoshi, 'USD', options)
// .then(function (data) {
//   logger.log('amount in USD: $%s', data);
// });
// calculate conversion rate to minutes