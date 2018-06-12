// var mongoose = require('mongoose'),
//     Schema = mongoose.Schema,
//     moment = require('moment'),
//     config = require('../config/index'),
//     logger = config.logger,
//     fs = require('fs'),
//     scraper = require('../mods/scraper'),
//     bcrypt = require('bcrypt-nodejs'),
//     crypto = require('crypto'),
//     _ = require('underscore'),
//     Money = require('es-money'),
//     async = require('async'),
//     Gmail = require('../mods/gmail'),
//     Payment = require('../models/payment'),
//     Payout = require('../models/payout'),
//     User = require('../models/user');

// var options = { 'discriminatorKey': 'kind', 'usePushEach': true };

// var performerSchema = new Schema({
//   bio: { type: String, default: '' },
//   price: { type: String, default: '30.00' }, // add validator to require decimal digits
//   gender: { type: String, default: 'female' },

//   // profile image
//   image: { type: String },
//   imageName: { type: String },
//   profileImage: { data: Buffer, contentType: String, default: 0 },
//   // banner
//   banner: { type: String },
//   bannerName: { type: String },
//   bannerImage: { data: Buffer, contentType: String, default: 0 },

//   // $$$
//   total_gross: { type: String, default: '0.00' }, // total $ over time
//   payout_gross: { type: String, default: '0.00' }, // total paid out over time?
//   available_balance: { type: String, default: '0.00' }, // $ available
//   pending_balance: { type: String, default: '0.00' }, // $ pending until available
//   pending_payout: { type: String, default: '0.00' },
//   pending_payments: { type: Array, default: [] },
//   pending_payouts: { type: Array, default: [] },
//   processed_payments: { type: Array, default: [] },
//   processed_payouts: { type: Array, default: [] },
//   payouts: { type: Array, default: [] },

//   next_payout: { type: Date },
//   payout_schedule: { type: String, default: 'manual' },

//   fans: { type: Array, default: [] }, // list of fan _.ids

//   // for login
//   twitter: {
//     username: { type: String, default: '' },
//     displayName: { type: String, default: '' },
//     description: { type: String, default: '' },
//     profileImage: { type: String, default: "//placehold.it/700x450" },
//     bannerImage: { type: String, default: "//placehold.it/1500x500&text=Banner" },
//     accessToken: { type: String, default: '' }, 
//     refreshToken: { type: String, default: '' },

//     tweetNew: { type: Boolean, default: false },
//     tweetWeekly: { type: Boolean, default: false }
//   },

//   instagram: {
//     username: { type: String, default: '' },
//     displayName: { type: String, default: '' },
//     description: { type: String, default: '' },
//     profileImage: { type: String, default: "//placehold.it/700x450" },
//     photos: { type: Array, default: [] },
//   },

//   instagramDelay: { type: String },

// },options);

// performerSchema.pre('save', function (next) {
//   // var self = this;
//   logger.save('Performer: %s (%s\\%s)', this.username, this.active, this.deactivated);
//   if (config.debugging_bank) {
//     logger.bank('- available: %s',this.available_balance);
//     logger.bank('- pending_balance: %s',this.pending_balance);
//     logger.bank('- pending_payments: %s',this.pending_payments.length);
//     logger.bank('- processed_payments: %s',this.processed_payments.length);
//     logger.bank('- pending_payout: %s',this.pending_payout);
//     logger.bank('- pending_payouts: %s',this.pending_payouts.length);
//     logger.bank('- processed_payouts: %s',this.processed_payouts.length);
//     logger.bank('- total_gross: %s',this.total_gross);
//     logger.bank('- payout_gross: %s',this.payout_gross);
//   }
//   next();
// });


// // Statics
// // {'amount':self.amount,'net':self.net,'fee':self.fee,'id':self._id}
// performerSchema.statics.addPayment = function(payment, callback) {
//   logger.log('Adding Pending Payment to Performer: %s', payment.performer);
//   Performer.findOne({'_id':payment.performer}, function (err, performer) {
//     if (err) return callback(err);
//     if (!performer) return callback('Missing performer for payment!');
//     var pending_balance = new Money('USD', performer.pending_balance),
//         pending = new Money('USD', performer.pending_balance).amount,
//         amount = new Money('USD', payment.amount), // actual math done with net
//         net = new Money('USD',payment.net);
//     performer.pending_balance = pending_balance.add(net).amount;
//     performer.pending_payments.push(payment._id);
//     performer.payments.push(payment._id);
//     logger.log('Added Pending Payment to Performer (%s): %s + %s (%s) = %s', performer._id, pending, net.amount, amount.amount, performer.pending_balance);
//     performer.save(function (err) {
//       if (err) logger.warn(err);
//       callback(null);
//     });
//   });
// }

// performerSchema.statics.addPayout = function(payout, callback) {
//   logger.warn('THIS SHOULDN\'T BE FIRING');
//   logger.log('Adding Pending Payout to Performer: %s', payout.performer);
//   Performer.findOne({'_id':payout.performer}, function (err, performer) {
//     if (err) return callback(err);
//     if (!performer) return callback('Missing performer for payout!');
//     var pending_payout = new Money('USD', performer.pending_payout),
//         pending = new Money('USD', performer.pending_payout).amount,
//         amount = new Money('USD', payout.amount);
//     performer.pending_payout = pending_payout.add(amount).amount;
//     performer.pending_payouts.push(payout._id);
//     performer.payouts.push(payout._id);
//     logger.log('Added Pending Payout to Performer (%s): %s + %s = %s', performer._id, pending, amount.amount, performer.pending_payout);
//     performer.save(function (err) {
//       if (err) logger.warn(err);
//       callback(null);
//     });
//   });
// }

// performerSchema.statics.processMonthlyPayouts = function(callback) {
//   // gets all performers with their payout_schedule set for monthly
//   logger.log('Processing Monthly Payouts');
//   Performer.find({'payout_schedule':'monthly'}, function (err, performers) {
//     if (err) logger.warn(err);
//     var series = [];
//     _.forEach(performers, function (performer) {
//       series.push(function (step) {
//         performer.addPendingPayout(performer.available_balance, function (err) {
//           if (err) logger.warn(err);
//           setTimeout(() => { step(null); });
//         });
//       });
//     });
//     series.push(function (step) {
//       logger.log('Processed Monthly Payouts');
//       callback(null);
//     });
//     async.series(series);
//   });
// }

// performerSchema.statics.processWeeklyPayouts = function(callback) {
//   logger.log('Processing Weekly Payouts');
//   Performer.find({'payout_schedule':'weekly'}, function (err, performers) {
//     if (err) logger.warn(err);
//     var series = [];
//     _.forEach(performers, function (performer) {
//       series.push(function (step) {
//         performer.addPendingPayout(performer.available_balance, function (err) {
//           if (err) logger.warn(err);
//           setTimeout(() => { step(null); });
//         });
//       });
//     });
//     series.push(function (step) {
//       logger.log('Processed Monthly Payouts');
//       callback(null);
//     });
//     async.series(series);
//   });
// }

// performerSchema.statics.processWeeklyTweets = function(callback) {
//   // gets all performers with their payout_schedule set for monthly
//   logger.log('Processing Weekly Tweets');
//   Performer.find({'twitter.tweetWeekly':true}, function (err, performers) {
//     if (err) logger.warn(err);
//     var series = [];
//     _.forEach(performers, function (performer) {
//       series.push(function (step) {
//         performer.tweetWeekly(function (err) {
//           if (err) logger.warn(err);
//           setTimeout(() => { step(null); });
//         });
//       });
//     });
//     series.push(function (step) {
//       logger.log('Processed Weekly Tweets');
//       callback(null);
//     });
//     async.series(series);
//   });
// }
// // Methods


// // checks available_balance for amount
// // if not enough, returns error
// // if enough, deducts amount from available_balance
// // creates new payout
// // adds payout to list of performers payouts
// performerSchema.methods.addPendingPayout = function(amount, callback) {
//   var self = this;
//   if (!amount) return callback('Missing amount!');
//   amount = new Money('USD', amount);
//   if (amount.amount<config.minimumPayout) return callback('Not enough funds!');
//   var available_balance = new Money('USD',self.available_balance);
//   if (available_balance.amount<amount.amount) {
//     logger.warn('Not enough available funds! %s < %s',available_balance.amount,amount.amount);
//     return callback('Not enough funds!');
//   }
//   var payout = new Payout({'performer':self._id,'amount':amount.amount});
//   payout.save(function (err) {
//     if (err) logger.warn(err);
//     var pending_payout = new Money('USD', self.pending_payout),
//         pending = new Money('USD', self.pending_payout).amount,
//         amount = new Money('USD', payout.amount);
//     self.pending_payout = pending_payout.add(amount).amount;
//     self.pending_payouts.push(payout._id);
//     self.payouts.push(payout._id);
//     logger.log('Added Pending Payout to Performer (%s): %s + %s = %s', self._id, pending, amount.amount, self.pending_payout);
//     self.save(function (err) {
//       if (err) logger.warn(err);
//       callback(null);
//     });
//   });
// };

// // get all payments that are pending for performer
// // Payment.process(payment) each payment
// // if payment is complete, move amount from this.pending to this.available
// performerSchema.methods.processPendingPayments = function(callback) {
//   var self = this;
//   logger.log('Processing Pending Payments: %s (%s)',self.username, self.pending_payments.length);
//   Payment.find({'_id': { '$in': self.pending_payments }}, function (err, payments) {
//     if (err) logger.warn(err);
//     var series = [],
//         available_balance = new Money('USD', self.available_balance),
//         total_gross = new Money('USD', self.total_gross),
//         starting_balance = available_balance.amount,
//         paidOut = new Money('USD', '0.00'),
//         pending_balance = new Money('USD', self.pending_balance);
//     _.forEach(payments, function (payment) {
//       series.push(function (step) {
//         var amount = new Money('USD', payment.amount), // actual math done with net
//             net = new Money('USD',payment.net),
//             fee = new Money('USD',payment.fee);
//         if (parseInt(pending_balance.amount)<parseInt(net.amount)) {
//           logger.log('Not enough funds in pending balance! %s > %s',parseInt(pending_balance.amount), parseInt(net.amount));
//         // if (pending_balance.lessThan(amount)) {
//           // logger.log('Not enough funds in pending balance! %s > %s',amount.amount, pending_balance.amount);
//           return setTimeout(() => { step(null); });
//         }
//         payment.process(function (err) {
//           if (err) {
//             logger.log(err);
//             return setTimeout(() => { step(null); });
//           }
//           for (var i=0;i<self.pending_payments.length;i++) 
//             if (self.pending_payments[i].toString()===payment._id.toString()) 
//               self.pending_payments.splice(i,1);
//           self.processed_payments.push(payment._id);
//           available_balance = available_balance.add(net);
//           total_gross = total_gross.add(net);
//           paidOut = paidOut.add(net);
//           pending_balance = pending_balance.subtract(net);
//           // logger.log('available_balance: %s',available_balance.amount);
//           // logger.log('pending_balance: %s',pending_balance.amount);
//           // logger.log('amount: %s',net.amount);
//           setTimeout(() => { step(null); });
//         });
//       });
//     });
//     series.push(function (step) {
//       self.available_balance = available_balance.amount;
//       self.pending_balance = pending_balance.amount;
//       self.total_gross = total_gross.amount;
//       logger.log('Pending Payments Processed: %s',self.username);
//       logger.log('Available Balance: %s + %s = %s',starting_balance, paidOut.amount, available_balance.amount);
//       self.save(function (err) {
//         if (err) logger.warn(err);
//         callback(null, payments);
//       });
//     });
//     async.series(series);
//   });
// }

// performerSchema.methods.processPendingPayouts = function(callback) {
//   var self = this;
//   logger.log('Processing Pending Payouts: %s (%s)', self.username, self.pending_payouts.length);
//   Payout.find({'_id': { '$in': self.pending_payouts }}, function (err, payouts) {
//     if (err) logger.warn(err);
//     var series = [],
//         available_balance = new Money('USD', self.available_balance),
//         pending_payout = new Money('USD', self.pending_payout),
//         starting_balance = available_balance.amount,
//         paidOut = new Money('USD', '0.00'),
//         payout_gross = new Money('USD', self.payout_gross);
//     _.forEach(payouts, function (payout) {
//       series.push(function (step) {
//         var amount = new Money('USD', payout.amount);
//         // if (available_balance.lessThan(amount)) {
//           // logger.log('Not enough funds in available balance! %s > %s',amount.amount, available_balance.amount);
//         if (parseInt(available_balance.amount)<parseInt(amount.amount)) {
//           logger.log('Not enough funds in available balance! %s < %s',parseInt(available_balance.amount), parseInt(amount.amount));
//           return setTimeout(() => { step(null); });
//         }
//         payout.process(function (err) {
//           if (err) {
//             logger.log(err);
//             return setTimeout(() => { step(null); });
//           }
//           for (var i=0;i<self.pending_payouts.length;i++)
//             if (self.pending_payouts[i].toString()===payout._id.toString())
//               self.pending_payouts.splice(i,1);
//           self.processed_payouts.push(payout._id);
//           paidOut = paidOut.add(amount);
//           payout_gross = payout_gross.add(amount);
//           try {
//             available_balance = available_balance.subtract(amount);
//           }
//           catch (err) {
//               logger.warn('Subtraction error! Adjusting balance 1 cent for math');
//               available_balance = available_balance.add(new Money('USD', '0.01'));
//               available_balance = available_balance.subtract(amount);
//               available_balance = available_balance.subtract(new Money('USD', '0.01'));
//           }
//           try {
//             pending_payout = pending_payout.subtract(amount);
//           }
//           catch (err) {
//               logger.warn('Subtraction error! Adjusting balance 1 cent for math');
//               pending_payout = pending_payout.add(new Money('USD', '0.01'));
//               pending_payout = pending_payout.subtract(amount);
//               pending_payout = pending_payout.subtract(new Money('USD', '0.01'));
//           }
//           setTimeout(() => { step(null); });
//         });
//       });
//     });
//     series.push(function (step) {
//       self.available_balance = available_balance.amount;
//       self.pending_payout = pending_payout.amount;
//       self.payout_gross = payout_gross.amount;
//       logger.log('Pending Payouts Processed: %s',self.username);
//       logger.log('Available Balance: %s - %s = %s',starting_balance, paidOut.amount, available_balance.amount);
//       self.save(function (err) {
//         if (err) logger.warn(err);
//         callback(null, payouts);
//       });
//     });
//     async.series(series);
//   });
// }

// // performerSchema.methods.delete = function(callback) {
// //   var self = this;
// //   logger.remove('Deleting Performer: %s', self._id);
// //   var Subscription = require('../models/subscription');
// //   // more permanent version of deactivate
// //   // user is removed from db of users
// //   Performer.findOneAndRemove({'_id':self._id}, function (err) {
// //     if (err) return callback(err);
// //     logger.remove('User Deleted: %s', self._id);
// //     // user's subscriptions are canceled
// //     Subscription.suspendMany(self.subscriptions, function (err) {
// //       if (err) logger.warn(err);
// //       callback(null);
// //     });
// //   });
// // }

// // profile
// performerSchema.methods.saveProfilePhoto = function(pic, callback) {
//   var self = this;
//   // downloads file to server during upload
//   self.image = pic.filename;
//   self.imageName = pic.originalname;
//   // saves to mongo for later recache
//   self.profileImage.data = fs.readFileSync(pic.path);
//   self.profileImage.contentType = pic.mimetype;
//   self.save(function (err) {
//     if (err) logger.warn(err);
//     logger.log('Uploaded profile photo: %s (%s)', pic.originalname, self._id);
//     callback(null);
//   });  
// }

// performerSchema.methods.saveBannerPhoto = function(pic, callback) {
//   var self = this;
//   // downloads file to server during upload
//   self.banner = pic.filename;
//   self.bannerName = pic.originalname;
//   // saves to mongo for later recache
//   self.bannerImage.data = fs.readFileSync(pic.path);
//   self.bannerImage.contentType = pic.mimetype;
//   self.save(function (err) {
//     if (err) logger.warn(err);
//     logger.log('Uploaded banner photo: %s (%s)', pic.originalname, self._id);
//     callback(null);
//   });  
// }

// performerSchema.methods.subscribedBy = function(fan) {
//   // this.performers && this.fans are ERRONEOUSLY being treated as a String instead of an Array, indexOf instead of _.contains as appropriate
//   this.fans = this.fans.toString();
//   if (this.fans.indexOf(fan._id)>=0)
//     return true;
//   return false;
// };

// // Email

// performerSchema.methods.sendCanceledSubscriberEmail = function(fan, callback) {
//   var self = this;
//   logger.log('Sending Canceled Subscriber Email: %s unsubscribing from %s', fan._id, self._id);
//   if (!self.email) return callback('Missing email- '+self._id); 
//   var mailOptions = config.email_subscriber_canceled(self.email, fan.snapchat);
//   Gmail.sendEmail(mailOptions, function (err) {
//     if (err) return callback(err);
//     return callback(null);
//   });
// };

//   // email with text about new subscriber and their snapchat
//   //  ask them to add the new subscriber
//   //  asks them to tweet / share
// performerSchema.methods.sendNewSubscriberEmail = function(fan, callback) {
//   if (!fan.snapchat) return callback('Missing Fan\'s Snapchat');
//   logger.log('Sending New Subscriber Email: %s subscribing to %s', fan._id, this._id);
//   if (!this.email) return callback('Missing email- '+this._id); 
//   var mailOptions = config.email_new_subscriber(this.email, fan.snapchat);
//   Gmail.sendEmail(mailOptions, function (err) {
//     callback(err);
//   });
// };

// performerSchema.methods.sendSubscriptionRenewedEmail = function(fan, callback) {
//   if (!fan.snapchat) return callback('Missing Fan\'s Snapchat');
//   logger.log('Sending Subscription Renewed Email to Performer: %s -> %s', fan._id, this._id);
//   if (!this.email) return callback('Missing email- '+this._id); 
//   var mailOptions = config.email_subscriber_renewed(this.email, fan.snapchat);
//   Gmail.sendEmail(mailOptions, function (err) {
//     callback(err);
//   });
// };

// // Twitter

// performerSchema.methods.tweetNewSubscription = function(callback) {
//   var Twitter = require('../mods/twitter');
//   var tweet = config.twitter_new_subscriber(self);
//   Twitter.tweet(self, tweet, function (err) {
//     if (err) return callback(err);
//     logger.log('Performer Tweeted New Subscription: %s - %s', self._id, tweet.status);
//   });
// }

// performerSchema.methods.tweetWeekly = function(callback) {
//   var Twitter = require('../mods/twitter');
//   var tweet = twitter_weekly_reminder(self);
//   Twitter.tweet(self, tweet, function (err) {
//     if (err) return callback(err);
//     logger.log('Performer Tweeted Weekly: %s - %s', self._id, tweet.status);
//   });
// }

// // performerSchema.methods.subscribedBy = function(fan, callback) {
// //   logger.log('checking for subscription: %s -> %s', fan._id, this._id);
// //   var Subscription = require('../models/subscription');
// //   Subscription.findOne({'performer':this._id, 'fan':fan._id}, function (err, subscription) {
// //     if (err) logger.warn(err);
// //     if (!subscription) return callback(null, false);
// //     callback(null, true);
// //   });
// // };

// performerSchema.set('redisCache', true);
// var Performer = User.discriminator('performer', performerSchema, 'performers');
// module.exports = Performer;