var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    moment = require('moment'),
    config = require('../config/index'),
    logger = config.logger,
    async = require('async'),
    bcrypt = require('bcrypt-nodejs'),
    crypto = require('crypto'),
    _ = require('underscore');

// Viewer Schema
var viewerSchema = new Schema({
  ip: { type: String },
  lastVisit: { type: Date, default: moment(new Date()).format('MM/DD/YYYY') },
  payments: { type: Array, default: [] },
  start: { type: String, default: moment(new Date()).format('MM/DD/YYYY') },
  time: { type: Number, default: 0 }, // time allotted for live
  visits: { type: Number, default: 1 },
},{ 'discriminatorKey': 'kind', 'usePushEach': true });

viewerSchema.pre('save', function (next) {
  var self = this;
  next(null);
});

viewerSchema.methods.addTime = function(time, callback) {
	
}


var Viewer = mongoose.model('viewers', viewerSchema,'viewers');
module.exports = Viewer;