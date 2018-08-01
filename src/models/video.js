var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    config = require('../config/index'),
    logger = config.logger,
    moment = require('moment'),
    convert = require('../modules/video').convert,
    async = require('async'),
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
  duration: { type: Number },
  hasPreview: { type: Boolean, default: false },
  isPaid: { type: Boolean, default: false },
  isPreview: { type: Boolean, default: false },
  isOriginal: { type: Boolean, default: false },
  paid: { type: Number, default: 0 },
  path: { type: String },
  performers: { type: Array, default: [] },
  price: { type: Number },
  title: { type: String }
});

videoSchema.pre('save', function (next) {
  var self = this;
  self.description = [self.performers.slice(0, -1).join(', '), self.performers.slice(-1)[0]].join(self.performers.length < 2 ? '' : ' and ');
  self.path = self.title+'.mp4';
  if (self.isModified('paid')||self.isModified('duration')) {
    if (self.paid>=self.duration) {
      logger.debug('isPaid on save: %s', self._id);
      self.isPaid = true;
    }
    else self.isPaid = false;
  }
  if (self.isModified('duration')||self.isModified('price')) {
    if (self.duration<config.defaultPrice) { // 5 minutes / default time
      self.price = config.defaultPrice;
      logger.log('price set: %s', self.price);
    }
    else {
      self.price = Math.round(self.duration);
      logger.log('price upd: %s', self.price);
    }
  }
  logger.debug('Video Saved: %s', self.title);
  next();
});

videoSchema.statics.createPreviews = function(callback) {
  logger.log('Creating Video Previews');
  Video.find({'isOriginal':true,'isPreview':false,'hasPreview':false}, function (err, videos) {
    if (err) return callback(err);
    if (videos.length==0) {
      logger.log('Video Previews Skipped');
      return callback(null);
    }
    var series = [];
    for (var i=0;i<videos.length;i++)
      series.push(function (step) {
        var video = videos.shift();
        video.createPreview(function (err) {
          if (err) logger.warn(err);
          step(null);
        });
      });
    series.push(function (step) {
      logger.log('Video Previews Created');
      callback(null);
    });
    async.series(series);
  });
}

videoSchema.methods.createPreview = function(callback) {
  var self = this;
  // get file at location
  // convert to preview
  // save ref
  convert(self.path, function (err) {
    if (err) return callback(err);
    self.hasPreview = true;
    self.save(function (err) {
      callback(err);
    });
  });
}

var Video = mongoose.model('videos', videoSchema,'videos');
module.exports = Video;