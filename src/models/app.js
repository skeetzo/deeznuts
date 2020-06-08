var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    config = require('../config/index'),
    logger = config.logger;

// DeezNuts

// App Schema
var appSchema = new Schema({
  bootCount: { type: Number, default: 0 },
}, {'usePushEach': true});

appSchema.pre('save', function (next) {
  next();
});

appSchema.set('redisCache', false);
var App = mongoose.model('app', appSchema, 'app');

module.exports = App;