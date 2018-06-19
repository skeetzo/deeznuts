var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    moment = require('moment'),
    config = require('../config/index'),
    logger = config.logger,
    // async = require('async'),
    // bcrypt = require('bcrypt-nodejs'),
    // crypto = require('crypto'),
    _ = require('underscore'),
    Google = require('../modules/google'),
    Receive = require('blockchain.info/Receive'),
    Exchange = require('blockchain.info/exchange');

// Viewer Schema
var viewerSchema = new Schema({
  address: { type: String },
  ip: { type: String },
  lastVisit: { type: Date, default: moment(new Date()).format('MM/DD/YYYY') },
  payments: { type: Array, default: [] },
  secret : { type: String }, // crypto sig
  start: { type: String, default: moment(new Date()).format('MM/DD/YYYY') },
  time: { type: Number, default: config.defaultTime }, // time allotted for live
  time_added: { type: Number },
  visits: { type: Number, default: 1 },
});

viewerSchema.pre('save', function (next) {
  var self = this;
  if (!self.address&&!config.debugging) {
    // Generate new blockchain address
    var xpub = config.blockchainXpub,
     callback = config.blockchainCallback,
     key = config.blockchainKey,
     options = {};
    // myReceive is the blockchain Object for the new address's generation
    var myReceive = new Receive(xpub, callback, key, options);
    // this checks the gap or number of unused addresses that have been generated
    // gap - the current address gap (number of consecutive unused addresses)
    var checkgap = myReceive.checkgap()
    .then(function (data) {
      var gap = data.gap;
      logger.log('gap: %s', data.gap);
      // config.checkgap = gap;
    });
    // generate address
    var query = {'secret':'ballsacks'};
    myReceive = myReceive.generate(query)
    .then(function (data) {
      logger.log('Generated address: %s', data.address);
      self.address = data.address;
      // config.blockchainIndex = data.index;
      self.secret = data.callback.substring(data.callback.indexOf('=')+1);
      next(null);
    });
  }
  else if (!self.address&&config.debugging) {
    self.address = config.bitcoin_address;
    next(null);
  }
  else
    next(null);
});

// amount in satoshi, so divide by 100,000,000 to get the value in BTC
viewerSchema.methods.addTime = function(value_in_satoshi) {
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
    var timeAdded = convertToTime(dollar);
    logger.log('dollar converted: $%s -> %s seconds', dollar, timeAdded);
    logger.log('time added: %s seconds + %s seconds = %s seconds', self.time, timeAdded, (self.time+timeAdded));
    Google.logTime(value_in_satoshi, dollar, self.time, timeAdded);
    self.time_added = timeAdded;
    self.time+= timeAdded;
    self.save(function (err) {
      if (err) logger.warn(err);
    });
  });
  var options = {
    'time': (new Date()).getTime()
  };
  // Exchange.toBTC(value_in_btc, 'USD', options)
  // .then(function (data) {
  //   logger.log('amount in USD: %s', data);
  //   logger.log('data: %s', data);
  //   logger.log('data: %s', JSON.stringify(data, null, 4));
  // });
  Exchange.toBTC(value_in_satoshi, 'USD', options)
  .then(function (data) {
    logger.log('amount in USD: $%s', data);
  });
  // calculate conversion rate to minutes
}

var Viewer = mongoose.model('viewers', viewerSchema,'viewers');
module.exports = Viewer;


function convertToTime(dollar) {
  logger.log('dollar to time: $%s -> %s seconds', dollar, (dollar*(6*60)));
  return dollar*=(config.conversionRate*60); // 6 minutes per dollar
}