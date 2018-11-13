var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    config = require('../config/index'),
    logger = config.logger,
    moment = require('moment'),
    _ = require('underscore');

// Transaction Schema
var transactionSchema = new Schema({
  address: { type: String },
  confirmations: { type: Number, default: 0 },
  date: { type: Date, default: moment(new Date()).format('MM/DD/YYYY-hh:mm:ss') },
  reason: { type: String, default: 'live'},
  secret: { type: String },
  transaction_hash: { type: String },
  value: { type: Number },
  value_in_dollars: { type: Number },
  video: { type: String }
});

transactionSchema.pre('save', function (next) {
  var self = this;
  logger.debug('Transaction Saved: %s (%s) -> %s', self.value, self.confirmations, self.address);
  next();
});

transactionSchema.statics.add = function(newTransaction, callback) {
  logger.debug('Adding Transaction: %s (%s) -> %s', newTransaction.value, newTransaction.transaction_hash.substring(0,6), newTransaction.address);
  Transaction.findOne({'address':newTransaction.address,'transaction_hash':newTransaction.transaction_hash,'secret':newTransaction.secret}, function (err, transaction) {
    if (err) return callback(err);
    if (transaction) return callback('Existing Transaction: '+transaction.address+'-'+transaction.transaction_hash);
    transaction = new Transaction(newTransaction);
    require('../modules/blockchain').convertBTCtoDollar(transaction.value, function (err, dollar) {
      if (err) return callback(err);
      transaction.value_in_dollars = dollar;
      transaction.save(function (err) {
        callback(err, transaction);
      });
    });
  });
}

transactionSchema.statics.confirm = function(existingTransaction, callback) {
  logger.debug('Confirming Existing Transaction: %s (%s) -> %s', existingTransaction.value, existingTransaction.transaction_hash.substring(0,6), existingTransaction.address);
  Transaction.findOne({'address':existingTransaction.address,'transaction_hash':existingTransaction.transaction_hash,'secret':existingTransaction.secret}, function (err, transaction) {
    if (err) return callback(err);
    if (!transaction) return callback('Missing Transaction: '+existingTransaction.address+'-'+existingTransaction.transaction_hash);
    transaction.confirmations = parseInt(existingTransaction.confirmations, 10);
    logger.debug('Confirmed Existing Transaction: %s', transaction._id);
    if (transaction.confirmations>=config.blockchain_confirmations) transaction.confirmed = true;
    transaction.save(function (err) {
      callback(err, transaction);
    });
  });
}

transactionSchema.statics.sync = function(transactionQuery, callback) {
  logger.debug('Syncing Transaction: %s (%s)', transactionQuery.value, transactionQuery.transaction_hash);
  async.waterfall([
    function (step) {
      Transaction.findOne({'address':transactionQuery.address,'secret':transactionQuery.secret}, function (err, transaction) {
        if (err) return step(err);
        if (!transaction) return step('Error Syncing Transaction: Missing Transaction: '+transaction.address);
        step(null, transaction);
      });
    },
    function (transaction, user, step) {
      User.findOne({'addresses':transaction.address,'secrets':transaction.secret}, function (err, user) {
        if (err) return step(err);
        if (!user) return step('Error Syncing Transaction: No matching user: '+transaction.address);
        step(null, transaction, user);
      });
    },
    function (transaction, user, step) {
      // Confirm
      if (_.contains(user.transactions, transaction.transaction_hash)) {
        Transaction.confirm(transaction, function (err, transaction_) {
          if (err) return callback(err);
          logger.log('Confirmed Transaction: %s (%s) -> %s', transaction.value, transaction.confirmations, transaction.address, user._id);
          if (transaction_.confirmed) {
            if (!transaction.value_in_dollars) return callback('Error Confirming Transaction: Missing Value in Dollars');
            user.addTime(transaction.value_in_dollars, function (err) {
              callback(err);
            });
          }
          else
            callback(null);
        });
      }
      // Add
      else {
        Transaction.add(transaction, function (err) {
          if (err) return callback(err);
          logger.log('Added Transaction: %s (%s) -> %s', transaction.value, transaction.confirmations, transaction.address, user._id);
          user.transactions.push(transaction.transaction_hash);
          step(null);
        });
      }
    },
    function (step) {
      user.save(function (err) {
        step(err);
      });
    },
  ], function (err) {
    if (err) logger.warn(err);
    callback(null);
  });
}

var Transaction = mongoose.model('transactions', transactionSchema,'transactions');
module.exports = Transaction;