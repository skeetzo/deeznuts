var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    config = require('../config/index'),
    logger = config.logger,
    _ = require('underscore');

// User Schema
var transactionSchema = new Schema({
  address: { type: String },
  confirmations: { type: Number, default: 0 },
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
  logger.log('Adding Transaction: %s (%s) -> %s', newTransaction.value, newTransaction.confirmations, newTransaction.address);
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
  logger.log('Confirmed Existing Transaction: %s (%s) -> %s', existingTransaction.value, existingTransaction.confirmations, existingTransaction.address);
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