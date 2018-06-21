var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    moment = require('moment'),
    config = require('../config/index'),
    logger = config.logger,
    _ = require('underscore'),
    Google = require('../modules/google'),
    Receive = require('blockchain.info/Receive'),
    Exchange = require('blockchain.info/exchange'),
    QRCode = require('qrcode');

// Viewer Schema
var viewerSchema = new Schema({
  address: { type: String },
  address_qr: { type: String },
  ip: { type: String },
  lastVisit: { type: Date, default: moment(new Date()).format('MM/DD/YYYY') },
  qr: { type: String },
  secret : { type: String }, // crypto sig
  start: { type: String, default: moment(new Date()).format('MM/DD/YYYY') },
  time: { type: Number, default: config.defaultTime }, // time allotted for live
  time_added: { type: Number },
  transactions: { type: Array, default: [] },
  visits: { type: Number, default: 1 },
});

viewerSchema.pre('save', function (next) {
  var self = this;
  next(null);
});


viewerSchema.statics.addTransaction = function(transaction, callback) {
  logger.log('Adding Transaction: %s -> %s (%s)', transaction.value, transaction.address, transaction.hash);
  Viewer.findOne({'address':transaction.address,'secret':transaction.secret}, function (err, viewer) {
    if (err) return callback(err);
    if (!viewer) return callback('No matching viewer: '+transaction.address);
    if (_.contains(_.pluck(viewer.transactions,'transaction_hash'),transaction.transaction_hash)) {
      var existing_transaction = _.findWhere(viewer.transactions, {'transaction_hash':transaction.transaction_hash});
      logger.log('Confirmed Existing Transaction: %s -> %s (%s)', existing_transaction.confirmations, transaction.confirmations, transaction.hash);
      existing_transaction.confirmations = transaction.confirmations;
    }
    else {
      logger.log('Added Transaction: %s -> %s (%s)', transaction.value, transaction.address, transaction.hash);
      viewer.transactions.push({'value':transaction.value,'secret':transaction.secret,'address':transaction.address,'hash':transaction.transaction_hash,'confirmations':transaction.confirmations});
      viewer.addTime(transaction.value);
    }
  });
}

viewerSchema.statics.generateAddress = function(viewer, callback) {
  logger.log('Generating Address: %s', viewer.ip);
  Viewer.findOne({'ip':viewer.ip}, function (err, viewer) {
    if (err) return callback(err);
    if (viewer.address) return callback('Address already generated: '+viewer.ip);
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
    viewer.secret = hash;
    var query = {'secret':hash};
    myReceive = myReceive.generate(query)
    .then(function (data) {
      logger.log('Generated Address: %s', data.address);
      viewer.address = data.address;
      QRCode.toDataURL(data.address, function (err, url) {
        if (err) logger.warn(err);
        viewer.address_qr = url;
        // logger.debug('address_qr: %s', url);
        viewer.save(function (err) {
          callback(err);
        });
      });
    });
  });
}

viewerSchema.statics.sync = function(data, callback) {
  Viewer.findOne({'ip':data.ip}, function (err, viewer) {
    if (err) return callback(err);
    if (!viewer) return 'Viewer not found: '+data.ip;
    if (Math.abs(parseInt(viewer.time)-parseInt(data.time))>5)
      logger.log('not syncing time: %s seconds -> %s seconds', viewer.time, data.time);
    else if (data.time<=3) {
      logger.debug('syncing time (bug): %s seconds -> %s (%s) seconds', viewer.time, 0, data.time);
      viewer.time = 0;
    }
    else {
      // logger.log('syncing time: %s seconds -> %s seconds', viewer.time, data.time);
      viewer.time = data.time;
    }
    var added = viewer.time_added || false;
    viewer.time_added = false;
    viewer.save(function (err) {
      callback(err,{'time':viewer.time,'added':added,'status':config.status});
    });
  });
}

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

var Viewer = mongoose.model('viewers', viewerSchema,'viewers');
module.exports = Viewer;


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