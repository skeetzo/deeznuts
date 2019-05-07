var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    config = require('../config/index'),
    logger = config.logger;

// DeezNuts

// App Schema
var appSchema = new Schema({
  bootCount: { type: Number, default: 0 },
  // recycled addresses w/ secrets
  blockchain_addresses : { type: Array, default: [] },
  // blockchain_addresses_used : { type: Array, default: [] },
  blockchain_gap : { type: Number, default: config.blockchainGapLimit },
  // Google
  // - Drive & Sheet access
  google: {
    access_token: { type: String },
    refresh_token: { type: String }
  },
}, {'usePushEach': true});

appSchema.pre('save', function (next) {
  next();
});

appSchema.statics.getRecycled = function(callback) {
  App.findOne({}, function (err, app) {
    if (err) return callback(err);
    if (!app) return callback('Error: Missing App');
    if (!app.blockchain_addresses) app.blockchain_addresses = [];
    if (app.blockchain_addresses.length==0) return callback('Error: No Recycled Addresses');
    var index = Math.floor(Math.random()*app.blockchain_addresses.length);
    var addressAndSecret = app.blockchain_addresses[index];
    app.blockchain_addresses.splice(index, 1);
    app.save(function (err) {
      callback(err, addressAndSecret);
    });
  });
}

appSchema.statics.recycleAddress = function(addressAndSecret, callback) {
  App.findOne({}, function (err, app) {
    if (err) return callback(err);
    if (!app.blockchain_addresses) app.blockchain_addresses = [];
    app.blockchain_addresses.push(addressAndSecret);
    app.save(function (err) {
      callback(err);
    });
  }); 
}

// payments and payouts are added / subtracted towardspayment_fees the pending_balance and available_balance as appropriate

appSchema.set('redisCache', false);
var App = mongoose.model('app', appSchema,'app');



// // knex
// var db = require("mongoose-sql");
// db.migreateSchemas([App]).then(function() { // call migreateSchemas with model
//     console.log("moved app data to PostgreSQL from Mongoose");
// });


module.exports = App;