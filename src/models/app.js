var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    config = require('../config/index'),
    logger = config.logger;

// DeezNuts

// App Schema
var appSchema = new Schema({
  bootCount: { type: Number, default: 0 },

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

// payments and payouts are added / subtracted towardspayment_fees the pending_balance and available_balance as appropriate

appSchema.set('redisCache', false);
var App = mongoose.model('app', appSchema,'app');



// // knex
// var db = require("mongoose-sql");
// db.migreateSchemas([App]).then(function() { // call migreateSchemas with model
//     console.log("moved app data to PostgreSQL from Mongoose");
// });


module.exports = App;