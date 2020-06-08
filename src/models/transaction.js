var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    config = require('../config/index'),
    logger = config.logger,
    moment = require('moment'),
    _ = require('underscore'),
    Money = require('es-money'),
    async = require('async');

// Transaction Schema
var transactionSchema = new Schema({
  date: { type: Date, default: moment(new Date()).format('MM/DD/YYYY-hh:mm:ss') },
  user: { type: Schema.ObjectId }, // id 
  //
  address: { type: String },
  secret: { type: String },
  hash: { type: String },
  confirmed: { type: Boolean, default: false },
  confirmations: { type: Number, default: 0 },
  // in satoshis
  value: { type: Number },
  value_in_dollars: { type: Number },
});

transactionSchema.pre('save', function (next) {
  logger.debug('Transaction Saved: %s (%s) -> %s', this.value, this.confirmations, this.address);
  next();
});

transactionSchema.statics.add = function(newTransaction, callback) {
  logger.log('Adding Transaction: %s satoshi (%s) -> %s', newTransaction.value, newTransaction.hash.substring(0,6), newTransaction.address);
  async.waterfall([
    function (step) {
      Transaction.findOne({'address':newTransaction.address,'hash':newTransaction.hash}, function (err, transaction) {
        if (err) return step(err);
        if (transaction) return callback(null, transaction);
        transaction = new Transaction(newTransaction);
        logger.log('Creating Transaction: %s', transaction._id);
        step(null, transaction);
      });
    },
    function (transaction, step) {
      convertToDollar(newTransaction.value, function (err, value_in_dollars) {
        if (err) {
          logger.warn(err);
          return step(null);
        }
        transaction.value_in_dollars = value_in_dollars
        step(err, transaction);
      });
    },
    function (transaction, step) {
      var User = require('../models/user');
      User.find({}, function (err, users) {
        if (err) return step(err);
        for (var i=0;i<users.length;i++) {
          // logger.debug("addresses: %s", JSON.stringify(users[i].addresses));
          for (var j=0;j<users[i].addresses.length;j++) {
            // logger.debug("address: %s  %s:base", users[i].addresses[j].address, transaction.address);
            if (users[i].addresses[j].address==transaction.address) {
              transaction.user = users[i]
              return step(null, transaction);
            }
          }
        }
        step("Error: Unable to find User for Transaction");
      });
    },
    function (transaction, step) {
      transaction.save(function (err) {
        if (err) return step(err);
        step(null, transaction);
      });
    },
    function (transaction, step) {
      logger.log("Transaction Added: %s", transaction.hash.substring(0,6));
      callback(null, transaction)
    }
  ], function (err) {
    callback(err);
  });
}

transactionSchema.statics.confirm = function(existingTransaction, callback) {
  logger.log('Confirming Transaction: %s (%s) -> %s', existingTransaction.value, existingTransaction.hash.substring(0,6), existingTransaction.address);
  async.waterfall([
      function (step) {
        Transaction.findOne({'address':existingTransaction.address,'hash':existingTransaction.hash}, function (err, transaction) {
          if (err) return step(err);
          if (!transaction) return step('Missing Transaction: '+existingTransaction.address+'-'+existingTransaction.hash);
          transaction.confirmations = parseInt(existingTransaction.confirmations, 10);
          logger.debug('Confirmed Transaction: %s', transaction._id);
          transaction.save(function (err) {
            step(err, transaction);
          });
        });
      },
      function (transaction, step) {
        if (!transaction.user) return callback('Error Confirming Transaction: Missing User');
        if (config.wallet_confirmations_required&&transaction.confirmations<config.wallet_confirmations_number) return callback("Warning: Transaction confirmation number too low");
        if (transaction.confirmed) return callback(null, transaction);
        if (!transaction.value_in_dollars)
          convertToDollar(transaction.value, function (err, value_in_dollars) {
            if (err) return step(err);
            transaction.value_in_dollars = value_in_dollars;
            step(null)
          });
        else step(null, transaction);
      },
      function (step) {
        var User = require('../models/user');
        User.findById(transaction.user, function (err, user) {
          if (err) return step(err);
          if (!user) return step('Error Confirming Transaction: Missing User');
          step(null, transaction, user);
        });
      },
      function (transaction, user, step) {
        if (!transaction.value_in_dollars) return step('Error Confirming Transaction: Missing Value in Dollars');
        user.addTime(transaction.value_in_dollars, function (err) {
          step(err, transaction, user);
        });
      },
      function (transaction, user, step) {
        user.save(function (err) {
          if (err) return step(err);
          transaction.confirmed = true;
          transaction.save(function (err) {
            step(err, transaction);
          });
        });
      },
      function (transaction, step) {
        logger.log("Transaction Confirmed: %s", transaction.hash);
        callback(null, transaction);
      }
    ], function (err) {
    callback(err);
  });
}

// Syncs from TX History
// - adds if missing, then confirms
transactionSchema.statics.sync = function(transaction, callback) {
  logger.debug('Syncing Transaction: %s', transaction.hash.substring(0,6));
  // logger.debug(transaction);
  for (var i=0;i<transaction.outputs.length;i++)
    if (transaction.outputs[i].path) {
      transaction.address = transaction.outputs[i].address;
      transaction.value = transaction.outputs[i].value;
    }
  // transaction.address = transaction.outputs[0].address;
  // transaction.value = transaction.outputs[0].value;
  async.waterfall([
    function (step) {
      Transaction.add(transaction, function (err, tx) {
        step(err, tx);
      });
    },
    function (tx, step) {
      if (!tx.confirmations||tx.confirmations==0) return callback(null);
      Transaction.confirm(tx, function (err) {
        callback(err);
      });
    }
  ],
  function (err) {
    if (err) logger.warn(err);
    callback(null);
  });
}

////////////

// Methods

function convertToDollar(transaction, callback) {
  var Wallet = require('../modules/wallet');
  Wallet.convertToDollar(transaction.value, function (err, value) {
    callback(err, value);
  });
}

////////////

var Transaction = mongoose.model('transactions', transactionSchema, 'transactions');
module.exports = Transaction;