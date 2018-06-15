var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    moment = require('moment'),
    config = require('../config/index'),
    logger = config.logger,
    // async = require('async'),
    // bcrypt = require('bcrypt-nodejs'),
    // crypto = require('crypto'),
    _ = require('underscore'),
    Receive = require('blockchain.info/Receive');

// Viewer Schema
var viewerSchema = new Schema({
  address: { type: String },
  ip: { type: String },
  lastVisit: { type: Date, default: moment(new Date()).format('MM/DD/YYYY') },
  payments: { type: Array, default: [] },
  secret : { type: String }, // crypto sig
  start: { type: String, default: moment(new Date()).format('MM/DD/YYYY') },
  time: { type: Number, default: 0 }, // time allotted for live
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
    self.address = "7h15157o74lly4b17co1n4ddre55";
    next(null);
  }
  else
    next(null);
});

// amount in satoshi, so divide by 100,000,000 to get the value in BTC
viewerSchema.methods.addTime = function(amount) {
	var self = this;
  logger.log('Calculating time: %s', amount);
  // calculate conversion rate to dollar
  var exchange = require('blockchain.info/exchange');
  var options = {
    // 'time': (new Date).getTime()
  };
  exchange.fromBTC(amount, 'USD', options)
  .then(function (data) {
    logger.log('amount in USD: %s', data);
    logger.log('data: %s', data);
    logger.log('data: %s', JSON.stringify(data, null, 4));
    var time = 1;
    var timeAdded = convertToTime(time);
    logger.log('time added: %s + %s = %s', self.time, timeAdded, (self.time+timeAdded));
    self.time+= timeAdded;
    self.save(function (err) {
      if (err) logger.warn(err);
    });
  });
  // calculate conversion rate to minutes
}

var Viewer = mongoose.model('viewers', viewerSchema,'viewers');
module.exports = Viewer;


function convertToTime(time) {
  time*=5; // 5 minutes per dollar
}