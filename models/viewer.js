var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    moment = require('moment'),
    nodemailer = require('nodemailer'),
    config = require('../config/index'),
    logger = config.logger,
    async = require('async'),
    bcrypt = require('bcrypt-nodejs'),
    crypto = require('crypto'),
    Drive = require('../mods/drive'),
    Gmail = require('../mods/gmail'),
    Subscription = require('../models/subscription'),
    _ = require('underscore');

// User Schema
var userSchema = new Schema({
  // Required user info
  username: { type: String, required: true },
  email: { type: String, default: '' },
  emailPending: { type: String },
  emailVerified: { type: Boolean, default: false },

  emailVerifyToken: { type: String },
  emailVerifyExpires: { type: String },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: String },

  name: { type: String, default: '' },
  gender: { type: String, default: 'male' },
  birthday: { type: Date, default: moment(new Date()).format('MM/DD/YYYY') },
  subscriptions: { type: Array, default: [] }, // _ids
  snapchat: { type: String },
  snapchatDelay: { type: String }, // prevents frequent snapchat updates

  billable: { type: Boolean, default: false }, // CCBill check, true once connected
  payments: { type: Array, default: [] },

  active: { type: Boolean, default: false },
  start: { type: String, default: moment(new Date()).format('MM/DD/YYYY') },
  deactivated: { type: Boolean, default: false },
  expiresOn: { type: String },

  logins: { type: Number, default: 0 },

  // instagram
  instagram: {
    access_token: { type: String },
    username: { type: String },
    profile_picture: { type: String },
    full_name: { type: String },
    bio: { type: String },
  },

  // google sheets
  google: {
    spreadsheet_id : { type: String },
    spreadsheet_url : { type: String },
  },

},{ 'discriminatorKey': 'kind', 'usePushEach': true });

userSchema.pre('save', function (next) {
  var self = this;
  if (!this.google.spreadsheet_id&&config.copying_sheets) {
    return Drive.createUserSheet(this, function (err) {
      if (err) logger.warn(err);
      next(null);
    });
  }
  next(null);
});


// Statics


userSchema.statics.deleteOldUsers = function(callback) {
  var self = this;
  logger.remove('Deleting Old Deactivated Users');
  // if deactivated and expired or unverified and oldder than 30 days
  self.find( { '$or': [ {'deactivated': true, 'expiresOn': { '$lt': Date.now() } }, {'emailVerified': false, 'start': { '$gt': Date.now()+(1000*60*60*24*30) } } ] }, function (err, users) {
    if (err) return callback(err);
    if (!users||users.length==0) {
      logger.remove('No users to delete!');
      return callback(null);
    }
    logger.debug('Old Accounts: %s',_.pluck(users,'_id').join(', '));
    var series = [];
    _.forEach(users, function (user) {
      series.push(function (step) {
        user.delete(function (err) {
          if (err) logger.warn(err);
          step(null);
        });
      });
    })
    series.push(function (step) {
      callback(null);
    });
    async.series(series);
  });
};

userSchema.statics.verifyEmail = function(token, callback) {
  // logger.debug('Verifying email token: %s', token);
  User.findOne({ 'emailVerifyToken': token, 'emailVerifyExpires': { $gt: Date.now() } }, function (err, user) {
    if (err) {
      logger.warn(err);
      return callback('There was an error!');
    }
    if (!user) {
      logger.log('No user found for token: %s', token);
      return callback('Email verify token is invalid or has expired!');
    }
    user.emailVerified = true;
    user.email = user.emailPending;
    user.emailPending = '';
    user.save(function (err) {
      if (err) logger.warn(err);
      callback(null, user);
      logger.log('Email Verified: %s', user._id);
    });
  });
}

// Methods


userSchema.methods.deactivate = function(callback) {
  var self = this;
  logger.log('Deactivating User: %s', self._id);
  self.deactivated = true;
  self.expiresOn = Date.now() + 1000*60*60*24*30;
  Subscription.suspendMany(self.subscriptions, function (err) {
    if (err) logger.warn(err);
    self.save(callback);
  });
}

// more permanent version of deactivate
// user is removed from db of users
userSchema.methods.delete = function(callback) {
  var self = this;
  if (!self.deactivated) return callback('User is not deactivated! '+self._id);
  logger.remove('Deleting User: %s', self._id);
  // add backup function
  User.remove({'_id':self._id}, function (err) {
    if (err) return callback(err);
    logger.remove('User Deleted: %s',self._id);
    Subscription.cancelMany(self.subscriptions, callback);
  });
}

// compares one performer to another
userSchema.methods.isPerformer = function(performer, callback) {
  if (this.snapchat==performer.snapchat)
    return true;
  return false;
};

userSchema.methods.reactivate = function(callback) {
  var self = this;
  logger.log('Reactivating User: %s', self._id);
  if (!self.deactivated) return callback('User not deactivated: '+self._id);
  self.deactivated = false;
  self.expiresOn = null;
  Subscription.unsuspendMany(self.subscriptions, function (err) {
    if (err) logger.warn(err);
    self.save(callback);
  });
}

// sends reset email which contains a code and link to resetPasswordVerify
userSchema.methods.resetPassword = function(callback) {
  var self = this;
  logger.log('Resetting Password: %s', self._id);
  if (!self.email) {
    logger.warn('Missing email: %s', self._id);
    return callback('Missing email!');
  }
  async.waterfall([
    function (done) {
      crypto.randomBytes(20, function (err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function (token, done) {
      self.sendPasswordReset(token, function (err) {
        done(err, token);
      });
    },
    function (token, done) {
      self.resetPasswordToken = token;
      self.resetPasswordExpires = Date.now() + 3600000; // 1 hour
      self.save(function (err) {
        done(err);
      });
    },
  ], 
  function (err) {
    if (err) logger.warn(err);
    callback(err);
  });
};

// sends verification email to username
userSchema.methods.verifyEmail = function(email, callback) {
  var self = this;
  logger.log('Verifying Email: %s',self._id);
  if (!email) {
    logger.warn('Missing email.');
    return callback(null);
  }
  async.waterfall([
    function (done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function (token, done) {
      self.sendVerificationEmail(email, token, function (err) {
        done(err, token);
      });
    },
    function (token, done) {
      self.emailPending = email;
      self.emailVerified = false;
      self.emailVerifyToken = token;
      self.emailVerifyExpires = Date.now() + 3600000; // 1 hour
      self.save(function (err) {
        callback(err);
      });
    },
  ], 
  function (err) {
    if (err) logger.warn(err);
    callback(err);
  });
}

// Email

userSchema.methods.sendPasswordReset = function(token, callback) {
  if (!this.email) return callback('Missing email: '+this._id); 
  logger.log('Sending Password Reset Email: %s', this._id);
  var mailOptions = config.email_password_reset(this.email, token);
  Gmail.sendEmail(mailOptions, callback);
};

userSchema.methods.sendVerificationEmail = function(email, token, callback) {
  if (!email) return callback('Missing email: '+this._id); 
  logger.log('Sending Verification Email: %s', this._id);
  var mailOptions = config.email_verification(email, token);
  Gmail.sendEmail(mailOptions, callback);
};

userSchema.set('redisCache', true);
var User = mongoose.model('users', userSchema,'users');
module.exports = User;