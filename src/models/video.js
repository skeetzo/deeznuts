var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    config = require('../config/index'),
    logger = config.logger,
    moment = require('moment'),
    async = require('async'),
    _ = require('underscore'),
    FFmpeg = require('fluent-ffmpeg'),
    path = require('path'),
    fs = require('fs'),
    fss = require('fs-extra');


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
  if (!self.path)
    self.path = '/public/videos/archive/'+self.title+'.mp4';
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
  logger.log('--- Converting: %s', self.path);
  FFmpeg.ffprobe(self.path, function (err, metadata) {
    if (err) return callback(err);
    if (!metadata||(metadata&&!metadata.format)) return callback('Missing File')
    async.waterfall([
      function (step) {
        logger.log('--- Extracting ---');
        self.extract(function (err, file) {
          step(err, file);
        });
      },
      function (file, step) {
        logger.log('--- Watermarking ---');
        self.watermark(function (err) {
          if (err) return step(err);
          // needs to move new watermarked file to overwrite existing cut file
          fs.rename(file.path.replace('.mp4','-w.mp4'), file.path, function (err) {
            step(err);
          });
        });
      },
      function (step) {
        logger.log('--- Conversion Complete: %s', self.path);
        self.hasPreview = true;
        self.save(function (err) {
          callback(err);
        });
      }
    ], function (err) {
      callback(err);
    });
  });
}
module.exports.convert = convert;

videoSchema.methods.extract = function(callback) {
  logger.log('Extracting: %s', this.title);
  const duration = Math.round(this.duration);
  logger.log('Duration: %s', duration);
  var newFile = path.resolve(__dirname, '../public/videos/previews/', this.title);
  logger.log('New File: %s', newFile);
  var conversion_process = new FFmpeg({ 'source': this.path, 'timeout': 0 });
  conversion_process
      .withVideoBitrate(1024)
      .withAspect('16:9')
      .withFps(30)
      .withAudioBitrate('128k')
      .withAudioCodec('aac')
      .toFormat('mp4')
      .duration(10)
    .on('start', function (commandLine) {
      logger.log("Extraction Started");
    })
    .on('error', function (err, stdout, stderr) {
      logger.log("Extraction Failed"); 
      callback(err);
    })
    .on('progress', function (progress) {
        process.stdout.write('Extracting: '+Math.round(progress.percent)+'%\033[0G');
    })
    .on('end', function () {
      logger.log("Extraction Finished");
      callback(null);
    })
    .saveToFile(newFile); 
}

videoSchema.methods.watermark = function(callback) {
  var self = this;
  logger.log('Watermarking: %s', self.title);
  var newFile = path.resolve(__dirname, '../public/videos/previews/', self.path.replace('.mp4', '-w.mp4'))
  logger.log('New File: %s', newFile);
  var conversion_process = new FFmpeg({ 'source': self.path, 'timeout': 0 });
  conversion_process
    .input(path.resolve(__dirname, "../public/images/watermark.png"))
    .complexFilter([
      {
        'filter': 'scale',
        'options': {
          'w': 150,
          'h': 150, 
        },
        'inputs': '[1:v]',
        'outputs': 'watermark'
      },
      // {
      //  'filter': 'fade',
      //  'options': { 
      //    'type': 'out',
      //    'alpha': 1,
      //    'color': 'white',
      //    'duration': 3
      //  },
      //  'inputs': 'watermark',
      //  'outputs': 'watermarked'
      // },
      // combined
      {
        'filter': 'overlay',
        'options': {
          'x': 25,
          'y': 25,
        },
        'inputs': ['[0:v]','watermark'],
        'outputs': 'output'
      },
      ], 'output')
      .toFormat('mp4')
    .on('start', function (commandLine) {
      logger.log("Watermarking Started");
    })
    .on('error', function (err, stdout, stderr) {
      logger.log("Watermarking Failed"); 
      callback(err);
    })
    .on('progress', function (progress) {
      process.stdout.write("Watermarking: "+Math.round(progress.percent)+'%\033[0G');
    })
    .on('end', function () {
      logger.log("Watermarking Finished");
      logger.log('--- Watermarked: %s', self.title);
      callback(null);
    })
    .saveToFile(newFile); 
}


var Video = mongoose.model('videos', videoSchema,'videos');
module.exports = Video;
