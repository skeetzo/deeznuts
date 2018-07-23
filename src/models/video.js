var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    config = require('../config/index'),
    logger = config.logger,
    moment = require('moment'),
    _ = require('underscore');

// Video Schema
/*

  a 'new Video()' is created for each User for each Video
    each video has a separate address generated attached to their User

  a single instance of each Video exists from which videos_all is populated

*/
var videoSchema = new Schema({
  address: { type: String },
  address_qr: { type: String },
  description: { type: String, default: '' },
  original: { type: Boolean, default: false },
  paid: { type: Number, default: 0 },
  performers: { type: Array, default: [] },
  price: { type: Number, default: config.defaultPrice },
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