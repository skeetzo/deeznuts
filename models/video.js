// var mongoose = require('mongoose'),
//     Schema = mongoose.Schema,
//     moment = require('moment'),
//     config = require('../config/index'),
//     logger = config.logger,
//     Money = require('es-money'),
//     async = require('async'),
//     _ = require('underscore');

// // Bank Schema
// var bankSchema = new Schema({

//   // $$$
//   total_gross: { type: String, default: '0.00' }, // total ever
//   available_balance: { type: String, default: '0.00' }, // current $ from payments from fans to be minused for payouts to performers
//   pending_balance: { type: String, default: '0.00' }, // current $ pending from fans -> ccbill -> kairos
//   pending_payout: { type: String, default: '0.00' },
//   payout_gross: { type: String, default: '0.00' }, // # added to per payout transaction
//   kairos_fees_gross: { type: String, default: '0.00' }, // # added to per payment  transaction
//   payment_fees_gross: { type: String, default: '0.00' },
//   payments: { type: Array, default: [] },
//   payouts: { type: Array, default: [] },
//   pending_payments: { type: Array, default: [] },
//   pending_payouts: { type: Array, default: [] },

// }, {'usePushEach': true});

// bankSchema.pre('save', function (next) {
//   logger.save('Bank saved:');
//   logger.bank('- available_balance: %s',this.available_balance);
//   logger.bank('- pending_balance: %s',this.pending_balance);
//   logger.bank('- pending_payout: %s',this.pending_payout);
//   logger.bank('- total_gross: %s',this.total_gross);
//   logger.bank('- kairos_fees_gross: %s',this.kairos_fees_gross);
//   logger.bank('- payment_fees_gross: %s',this.payment_fees_gross);
//   logger.bank('- payout_gross: %s',this.payout_gross);
//   next();
// });

// // payments and payouts are added / subtracted towardspayment_fees_gross the pending_balance and available_balance as appropriate


// // adds a payment from payment model to balance totals
// bankSchema.statics.addPayment = function(payment, callback) {
//   // logger.bank('Adding to Kairos Pending Balance: %s', payment.amount);
//   async.series([
//     function (step) {
//       var Performer = require('../models/performer');
//       Performer.addPayment(payment, function (err) {
//         if (err) logger.warn(err);
//         step(null);
//       });
//     },
//     function (step) {
//       var Fan = require('../models/fan');
//       Fan.addPayment(payment, function (err) {
//         if (err) logger.warn(err);
//         step(null);
//       });
//     },
//     function (step) {
//       Bank.findOne({}, function (err, bank) {
//         var pending_balance = new Money('USD', bank.pending_balance),
//             amount = new Money('USD',payment.amount),
//             net = new Money('USD',payment.net),
//             pending = pending_balance.amount;
//         pending_balance = pending_balance.add(net);
//         bank.pending_balance = pending_balance.amount;
//         bank.pending_payments.push(payment._id);
//         logger.bank('Pending Payment added to Kairos: %s + %s (%s) = %s', pending, net.amount, amount.amount, pending_balance.amount);
//         bank.save(function (err) {
//           if (err) logger.warn(err);
//           callback(null);
//         });
//       });
//     },
//   ]);
// }

// bankSchema.statics.addPayout = function(payout, callback) {
//   // logger.bank('Subtracting from Kairos Available Balance: %s', payout.amount);
//   async.series([
//     function (step) {
//       var Performer = require('../models/performer');
//       Performer.addPayout(payout, function (err) {
//         if (err) logger.warn(err);
//         step(null);
//       });
//     },
//     function (step) {
//       Bank.findOne({}, function (err, bank) {
//         if (err) return callback(err);
//         var pending_payout = new Money('USD', bank.pending_payout),
//             amount = new Money('USD',payout.amount);
//         var pending = pending_payout.amount;
//         pending_payout = pending_payout.add(amount);
//         bank.pending_payout = pending_payout.amount;
//         bank.pending_payouts.push(payout._id);
//         logger.bank('Pending Payout added to Kairos: %s + %s = %s', pending, amount.amount, pending_payout.amount);
//         bank.save(function (err) {
//           if (err) logger.warn(err);
//           callback(null);
//         });
//       });
//     },
//   ]);
// }


// // gets all performers with pending payments
// // for each performer in performers
// // performer.processPendingPayments
// // if payment is complete, move amount from bank.pending to bank.available
// bankSchema.statics.processPendingPayments = function(callback) {
//   var Performer = require('../models/performer');
//   logger.bank('Processing Pending Payments');
//   Bank.findOne({}, function (err, bank) {
//     if (err) logger.warn(err);
//     var available_balance = new Money('USD',bank.available_balance),
//         pending_balance = new Money('USD',bank.pending_balance),
//         total_gross = new Money('USD',bank.total_gross),
//         payment_fees_gross = new Money('USD',bank.payment_fees_gross),
//         kairos_fees_gross = new Money('USD',bank.kairos_fees_gross),
//         starting_balance = available_balance.amount,
//         paidOut = new Money('USD', '0.00');
//     Performer.find({ 'pending_payments': { '$exists': true, '$not': {'$size':0} }}, function (err, performers) {
//       if (err) logger.warn(err);
//       var series = [];
//       _.forEach(performers, function (performer) {
//         series.push(function (step) {
//           performer.processPendingPayments(function (err, payments) {
//             if (err) logger.warn(err);
//             _.forEach(payments, function (payment) {
//               if (payment.status!='complete') return;
//               for (var i=0;i<bank.pending_payments.length;i++)
//                 if (bank.pending_payments[i].toString()===payment._id.toString())
//                   bank.pending_payments.splice(i,1);
//               var amount = new Money('USD',payment.amount),
//                   net = new Money('USD',payment.net),
//                   fee = new Money('USD',payment.fee),
//                   kairos_fee = new Money('USD',payment.kairos_fee);
//               // available_balance = available_balance.add(amount);
//               available_balance = available_balance.add(net);
//               total_gross = total_gross.add(net);
//               payment_fees_gross = payment_fees_gross.add(fee);
//               kairos_fees_gross = kairos_fees_gross.add(kairos_fee);
//               paidOut = paidOut.add(net);
//               // these should probably be nets
//               try {
//                 pending_balance = pending_balance.subtract(net);
//               }
//               catch (err) {
//                   logger.warn('Subtraction error! Adjusting balance 1 cent for math');
//                   pending_balance = pending_balance.add(new Money('USD', '0.01'));
//                   pending_balance = pending_balance.subtract(net);
//                   pending_balance = pending_balance.subtract(new Money('USD', '0.01'));
//               }
//             });
//             setTimeout(() => { step(null); });
//           });
//         });
//       });
//       series.push(function (step) {
//         bank.available_balance = available_balance.amount;
//         bank.total_gross = total_gross.amount;
//         bank.pending_balance = pending_balance.amount;
//         bank.payment_fees_gross = payment_fees_gross.amount;
//         bank.kairos_fees_gross = kairos_fees_gross.amount;
//         logger.bank('Pending Payments Processed');
//         logger.bank('Available Balance: %s + %s = %s',starting_balance, paidOut.amount, available_balance.amount);
//         bank.save(function (err) {
//           if (err) logger.warn(err);
//           callback(null);
//         });
//       })
//       async.series(series);
//     });
//   });
// }

// bankSchema.statics.processPendingPayouts = function(callback) {
//   var Performer = require('../models/performer');
//   logger.bank('Processing Pending Payouts');
//   Bank.findOne({}, function (err, bank) {
//     if (err) logger.warn(err);
//     var available_balance = new Money('USD', bank.available_balance),
//         pending_payout = new Money('USD', bank.pending_payout),
//         payout_gross = new Money('USD', bank.payout_gross),
//         starting_balance = available_balance.amount,
//         paidOut = new Money('USD', '0.00');
//     Performer.find({ 'pending_payouts': { '$exists': true, '$not': {'$size':0} }}, function (err, performers) {
//       if (err) logger.warn(err);
//       var series = [];
//       _.forEach(performers, function (performer) {
//         series.push(function (step) {
//           performer.processPendingPayouts(function (err, payouts) {
//             if (err) logger.warn(err);
//             _.forEach(payouts, function (payout) {
//               if (payout.status!='complete') return;
//               for (var i=0;i<bank.pending_payouts.length;i++)
//                 if (bank.pending_payouts[i].toString()===payout._id.toString())
//                   bank.pending_payouts.splice(i,1);
//               var amount = new Money('USD',payout.amount);
//               paidOut = paidOut.add(amount);
//               payout_gross = payout_gross.add(amount);
//               try {
//                 available_balance = available_balance.subtract(amount);
//               }
//               catch (err) {
//                   logger.warn('Subtraction error! Adjusting balance 1 cent for math');
//                   available_balance = available_balance.add(new Money('USD', '0.01'));
//                   available_balance = available_balance.subtract(amount);
//                   available_balance = available_balance.subtract(new Money('USD', '0.01'));
//               }
//               try {
//                 pending_payout = pending_payout.subtract(amount);
//               }
//               catch (err) {
//                   logger.warn('Subtraction error! Adjusting balance 1 cent for math');
//                   pending_payout = pending_payout.add(new Money('USD', '0.01'));
//                   pending_payout = pending_payout.subtract(amount);
//                   pending_payout = pending_payout.subtract(new Money('USD', '0.01'));
//               }
//             });
//             setTimeout(() => { step(null); });
//           });
//         });
//       });
//       series.push(function (step) {
//         bank.available_balance = available_balance.amount;
//         bank.pending_payout = pending_payout.amount;
//         bank.payout_gross = payout_gross.amount;
//         logger.bank('Pending Payouts Processed');
//         logger.bank('Available Balance: %s - %s = %s', starting_balance, paidOut.amount, available_balance.amount);
//         bank.save(function (err) {
//           if (err) logger.warn(err);
//           callback(null);
//         });
//       })
//       async.series(series);
//     });
//   });
// }

// bankSchema.set('redisCache', false);
// var Bank = mongoose.model('bank', bankSchema,'bank');
// module.exports = Bank;


// /*
// Money module

// const Money = require('es-money');
// const oneDollar = new Money('USD', 1) // Money {currency: 'USD', amount: '1.00'}

// oneDollar.add(oneDollar)
// // -> Money { currency: 'USD', amount: '1.00' }

// oneDollar.subtract(oneDollar)
// // -> Money { currency: 'USD', amount: '0.00' }

// oneDollar.multiply(1.1)
// // -> Money { currency: 'USD', amount: '1.10' }

// oneDollar.allocate([75, 25])
// // -> [Money { currency: 'USD', amount: '0.75' }, Money { currency: 'USD', amount: '0.25' }]

// oneHundredDollars.allocate([1, 1, 1])
// // -> [Money { currency: 'USD', amount: '33.34' }, Money { currency: 'USD', amount: '33.33' }, Money { currency: 'USD', amount: '33.33' }]

// JSON.stringify(oneDollar) // -> '{"currency":"USD","amount":"1.00"}'
// Money.fromObject({currency:'VND', amount:'1234'}) // -> Money { currency: 'VND', amount: '1234' }



// */


