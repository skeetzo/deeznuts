var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    config = require('../config/index'),
    logger = config.logger,
    moment = require('moment'),
    _ = require('underscore');

// Video Schema
var videoSchema = new Schema({
  description: { type: String, default: '' },
  performers: { type: Array, default: [] },
  price: { type: String, default: '$5.00' },
  title: { type: String }
});

videoSchema.pre('save', function (next) {
  var self = this;
  self.description = [self.performers.slice(0, -1).join(', '), self.performers.slice(-1)[0]].join(self.performers.length < 2 ? '' : ' and ');
  logger.debug('Video Saved: %s', self.title);
  next();
});

var Video = mongoose.model('videos', videoSchema,'videos');
module.exports = Video;