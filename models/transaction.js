var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    config = require('../config/index'),
    logger = config.logger,
    moment = require('moment'),
    _ = require('underscore');

// User Schema
var transactionSchema = new Schema({
  address: { type: String },
  confirmations: { type: Number, default: 0 },
  date: { type: Date, default: moment(new Date()).format('MM/DD/YYYY-hh:mm:ss') },
  secret: { type: String },
  transaction_hash: { type: String },
  value: { type: Number },
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
    transaction.save(function (err) {
      callback(err);
    });
  });
}

transactionSchema.statics.confirm = function(existingTransaction, callback) {
  logger.debug('Confirming Existing Transaction: %s (%s) -> %s', existingTransaction.value, newTransaction.transaction_hash.substring(0,6), existingTransaction.address);
  Transaction.findOne({'address':existingTransaction.address,'transaction_hash':existingTransaction.transaction_hash,'secret':existingTransaction.secret}, function (err, transaction) {
    if (err) return callback(err);
    if (!transaction) return callback('Missing Transaction: '+existingTransaction.address+'-'+existingTransaction.transaction_hash);
    transaction.confirmations = parseInt(existingTransaction.confirmations, 10);
    transaction.save(function (err) {
      callback(err);
    });
  });
}

var Transaction = mongoose.model('transactions', transactionSchema,'transactions');
module.exports = Transaction