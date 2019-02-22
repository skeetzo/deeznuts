var config = require('../config/index'),
    logger = config.logger,
    async = require('async');

var Receive = require('blockchain.info/Receive');

function convertBTCtoDollar(value_in_satoshi, callback) {
  logger.log('Converting satoshi to Dollar: %s', value_in_satoshi);
  var value_in_btc = value_in_satoshi / 100000000;
  logger.debug('satoshi to BTC: %s satoshi -> %sBTC', value_in_satoshi, value_in_btc);
  // calculate conversion rate to dollar
  var Exchange = require('blockchain.info/exchange');
  Exchange.getTicker({'currency':"USD"})
  .then(function (data) {
    if (!data.last) return callback('Missing BTC Converstion: '+value_in_satoshi);
    logger.debug('amountPerBTC: %s/BTC', data.last);
    var dollar = data.last*value_in_btc;
    logger.debug('BTC to dollar: %s/BTC * %sBTC -> +$%s', data.last, value_in_btc, dollar);
    callback(null, dollar);
  });
}
module.exports.convertBTCtoDollar = convertBTCtoDollar;


function getAddress(userId, callback) {
  async.waterfall([
    function (step) {
      var User = require('../models/user');
      User.findById(userId, function (err, user) {
        if (err) return step(err);
        if (user.address) return step('Live Address already generated: '+user._id);
        step(null, user);
      });
    },
    function (user, step) {
      var App = require('../models/app');
      App.getRecycled(function (err, addressAndSecret) {
        if (err) logger.warn(err);
        if (!addressAndSecret) return step(null, user);
        user.address = addressAndSecret[0];
        user.secret = addressAndSecret[1];
        user.save(function (err) {
          callback(err);
        });
      });
    },
    function (user, step) {
      logger.debug('creating address');
      createAddress(user, function (err, address) {
        if (err) return step(err);
        step(null, user, address);
      });  
    },
    function (user, address, step) {
      logger.debug('creating qr');
      createQR(address, function (err, qr) {
        if (err) return step(err);
        step(null, user, address, qr);
      });
    },
    function (user, address, url, step) {
      logger.debug('saving user');
      var App = require('../models/app');
      App.findOne({}, function (err, app) {
        if (err) logger.warn(err);
        app.blockchain_addresses.push(address);
        app.save(function (err) {logger.warn(err)}); 
      });
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
module.exports.getAddress = getAddress;




function createMyReceive(cb) {
  // Generate new blockchain address
  var myReceive = null;
  try {
    // myReceive is the blockchain Object for the new address's generation
    myReceive = new Receive(config.blockchainXpub, config.blockchainCallback, config.blockchainKey, {});
  }
  catch (err) {
    if (err.message&&err.description) {
      logger.warn('%s : %s', err.message, err.description);
      if (err.message=='Problem with xpub') {
        logger.debug('adjusting gap...');
        return cb('gap');
      }
    }
    return cb(err.message);
  }
  cb(null, myReceive);
}

function checkGap(myReceive, cb) {
  // this checks the gap or number of unused addresses that have been generated
  // gap - the current address gap (number of consecutive unused addresses)
  if (config.debugging_blockchain||!config.blockchainCheckGap) return cb(null, myReceive);
  logger.debug('checking blockchain gap...');
  var checkgap = myReceive.checkgap()
  .then(function (data) {
    logger.debug('gap: %s', data.gap);
    if (data.gap>config.blockchainGapLimit) {
      options = {
        '__unsafe__gapLimit':config.blockchainGapLimit
      };
      myReceive = new Receive(config.blockchainXpub, config.blockchainCallback, config.blockchainKey, options);
      logger.log('gap chain limit reached: '+data.gap);
      logger.debug('gap chain limit raised: %s', config.blockchainGapLimit);
      config.blockchainCheckGap = false;
    }
    cb(null, myReceive);
  });
}

function createAddress(user, cb) {
  async.waterfall([
    function (step) {
      createMyReceive(function (err, myReceive) {
        if (err) {
          logger.warn(err);
          return checkGap(myReceive, function (err, myReceive_) {
            if (err) return step(err);
            step(null, myReceive_);
          });
        }
        step(null, myReceive);
      });
    },
    function (myReceive, step) {
      generateAddress(user, myReceive, function (err, address) {
        if (err) {
          logger.warn(err);
          return createAddress(user, cb);
        }
        cb(null, address);
      });
    }
    ], function (err) {
      cb(err);
  });
}
  

function generateAddress(user, myReceive, cb) {
  logger.debug('generating new address');
  // generate address
  var timestamp = (Date.now() + 3600000);
  var hash = require('md5')(timestamp+"-"+config.blockchainHash);
  if (config.debugging_blockchain) hash = config.blockchainHash;
  user.secret = hash;
  user.save(function (err) {if (err) logger.warn(err)});
  var query = {'secret':hash};
  // logger.debug('query: %s', JSON.stringify(query, null, 4));
  if (config.debugging_blockchain) return cb(null, config.debugging_blockchain_address); 
  // logger.debug('generating address...');
  try {
    myReceive.generate(query)
    .then(function (generated) {
      // logger.debug('generated: %s', JSON.stringify(generated));
      cb(null, generated.address);
    });
  }
  catch (err) {
    if (err.message&&err.description) {
      logger.warn('%s : %s', err.message, err.description);
      if (err.message=='Problem with xpub') {
        logger.debug('adjusting gap...');
        return cb('gap');
      }
    }
    return cb(err.message);
  }
}

function createQR(address, cb) {
  var QRCode = require('qrcode');
  QRCode.toDataURL(address, function (err, url) {
    if (err) return cb(err);
    // logger.debug('qrcode: %s', url);
    cb(null, url);
  });
}

function getRecycled(cb) {
  var App = require('../models/app');
  App.getRecycled(function (err, address) {
    cb(err, address);
  });
}






























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