var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    moment = require('moment'),
    config = require('../config/index'),
    logger = config.logger,
    _ = require('underscore'),
    Google = require('../modules/google'),
    Receive = require('blockchain.info/Receive'),
    Exchange = require('blockchain.info/exchange'),
    bcrypt = require('bcrypt-nodejs'),
    QRCode = require('qrcode');

// User Schema
var userSchema = new Schema({
  address: { type: String },
  address_qr: { type: String },
  ip: { type: String, default: '' },
  lastVisit: { type: Date, default: moment(new Date()).format('MM/DD/YYYY') },
  logins: { type: Number, default: 0 },
  password: { type: String },
  qr: { type: String },
  secret : { type: String }, // crypto sig
  start: { type: String, default: moment(new Date()).format('MM/DD/YYYY') },
  time: { type: Number, default: config.defaultTime }, // time allotted for live
  time_added: { type: Number },
  transactions: { type: Array, default: [] },
  username: { type: String },
  visits: { type: Number, default: 1 },
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


userSchema.statics.addTransaction = function(transaction, callback) {
  logger.log('Adding Transaction: %s -> %s (%s)', transaction.value, transaction.address, transaction.hash);
  User.findOne({'address':transaction.address,'secret':transaction.secret}, function (err, user) {
    if (err) return callback(err);
    if (!user) return callback('No matching user: '+transaction.address);
    logger.log('transaction.transaction_hash: %s', transaction.transaction_hash);
    logger.log('user.transactions: %s', _.pluck(user.transactions,'transaction_hash'));
    if (_.contains(_.pluck(user.transactions,'transaction_hash'),transaction.transaction_hash)) {
      var existing_transaction = _.findWhere(user.transactions, {'transaction_hash':transaction.transaction_hash});
      logger.log('Confirmed Existing Transaction: %s -> %s (%s:%s)', existing_transaction.confirmations, transaction.confirmations, transaction.hash, user._id);
      existing_transaction.confirmations = transaction.confirmations;
    }
    else {
      logger.log('Added Transaction: %s -> %s (%s:%s)', transaction.value, transaction.address, transaction.hash, user._id);
      user.transactions.push({'value':transaction.value,'secret':transaction.secret,'address':transaction.address,'hash':transaction.transaction_hash,'confirmations':transaction.confirmations});
      user.addTime(transaction.value);
    }
  });
}

userSchema.statics.generateAddress = function(user, callback) {
  logger.log('Generating Address: %s', user.ip);
  User.findById(user._id, function (err, user) {
    if (err) return callback(err);
    if (user.address) return callback('Address already generated: '+user.ip);
    if (config.debugging) return callback('Skipping Address- Debugging');
    // Generate new blockchain address
    var xpub = config.blockchainXpub,
     cb = config.blockchainCallback,
     key = config.blockchainKey,
     options = {
      '__unsafe__gapLimit':50
     };
    // myReceive is the blockchain Object for the new address's generation
    var myReceive = new Receive(xpub, cb, key, options);
    // this checks the gap or number of unused addresses that have been generated
    // gap - the current address gap (number of consecutive unused addresses)
    var checkgap = myReceive.checkgap()
    .then(function (data) {
      var gap = data.gap;
      logger.log('gap: %s', data.gap);
      // config.checkgap = gap;
    });
    // generate address
    var timestamp = (Date.now() + 3600000);
    var hash = require('md5')(timestamp+"-"+config.blockchainHash);
    user.secret = hash;
    var query = {'secret':hash};
    myReceive = myReceive.generate(query)
    .then(function (data) {
      logger.log('Generated Address: %s', data.address);
      user.address = data.address;
      QRCode.toDataURL(data.address, function (err, url) {
        if (err) logger.warn(err);
        user.address_qr = url;
        // logger.debug('address_qr: %s', url);
        user.save(function (err) {
          callback(err);
        });
      });
    });
  });
}

userSchema.statics.sync = function(data, callback) {
  User.findById(data._id, function (err, user) {
    if (err) return callback(err);
    if (!user) return 'User not found: '+data._id;
    if (Math.abs(parseInt(user.time)-parseInt(data.time))>5)
      logger.log('not syncing time: %s seconds -> %s seconds', user.time, data.time);
    else if (data.time<=3) {
      logger.debug('syncing time (bug): %s seconds -> %s (%s) seconds', user.time, 0, data.time);
      user.time = 0;
    }
    else {
      logger.log('syncing time: %s seconds -> %s seconds', user.time, data.time);
      user.time = data.time;
    }
    var added = user.time_added || false;
    user.time_added = false;
    user.save(function (err) {
      callback(err,{'time':user.time,'added':added,'status':config.status});
    });
  });
}

// amount in satoshi, so divide by 100,000,000 to get the value in BTC
userSchema.methods.addTime = function(value_in_satoshi) {
	var self = this;
  logger.log('Calculating time: %s satoshi', value_in_satoshi);
  var value_in_btc = value_in_satoshi / 100000000;
  logger.log('satoshi to BTC: %s satoshi -> %sBTC', value_in_satoshi, value_in_btc);
  // calculate conversion rate to dollar
  Exchange.getTicker({'currency':"USD"})
  .then(function (data) {
    logger.log('amountPerBTC: %s/BTC', data.last);
    var dollar = data.last*value_in_btc;
    logger.log('BTC to dollar: %s/BTC * %sBTC -> +$%s', data.last, value_in_btc, dollar);
    logger.log('dollar to time: $%s -> %s seconds', dollar, (dollar*(6*60)));
    var timeAdded = dollar*(config.conversionRate*60); // 6 minutes per dollar
    logger.log('dollar converted: $%s -> %s seconds', dollar, timeAdded);
    logger.log('time added: %s seconds + %s seconds = %s seconds', self.time, timeAdded, (self.time+timeAdded));
    Google.logTime(value_in_satoshi, dollar, self.time, timeAdded);
    self.time_added = timeAdded;
    self.time+= timeAdded;
    self.save(function (err) {
      if (err) logger.warn(err);
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