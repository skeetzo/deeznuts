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
  isOriginal: { type: Boolean, default: false },
  paid: { type: Number, default: 0 },
  path: { type: String },
  path_preview: { type: String },
  path_image: { type: String },
  performers: { type: Array, default: [] },
  price: { type: Number },
  title: { type: String }
});

videoSchema.pre('save', function (next) {
  var self = this;
  self.description = [self.performers.slice(0, -1).join(', '), self.performers.slice(-1)[0]].join(self.performers.length < 2 ? '' : ' and ');
  if (!self.path)
    self.path = path.join(__dirname, '../public/videos/archive/', self.title+'.mp4');
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
  if (!self.duration) {
    // ffprobe video for duration
    FFmpeg.ffprobe(self.path, function(err, metadata) {
      if (err) return logger.warn(err);
      logger.debug('duration: %s', metadata.format.duration);
      self.duration = metadata.format.duration;
      logger.debug('Video Saved: %s', self.title);
      next();
    });
  }
  else {
    logger.debug('Video Saved: %s', self.title);
    next();
  }
});

// move any mp4s from public/videos/live/stream -> public/videos/archived
videoSchema.statics.archiveVideos = function(callback) {
  var fs = require('fs');
  logger.log('Archiving MP4s');
  // stream directories
  fs.readdir(path.join(__dirname, '../public/videos/live'), function (err, streams) {
    if (err) {
      logger.warn(err);
      return callback(null);
    }
    logger.debug('streams: %s', streams);
    var series = [];
    for (var i=0;i<streams.length;i++)
      series.push(function (next) {
        // mp4s in directories
        var stream_name = streams.shift();
        var stream_path = path.join(__dirname, '../public/videos/live', stream_name);
        var archived_path = path.join(__dirname, '../public/videos/archived', stream_name);
        // logger.debug('stream_name: %s', stream_name);
        logger.log('stream: %s', stream_name);
        logger.debug('stream_path: %s', stream_path);
        logger.debug('archived_path: %s', archived_path);
        // fss.ensureDirSync(archived_path);
        fss.ensureSymlinkSync(path.join(config.videosPath, 'archived/', stream_name), archived_path);
        fs.readdir(stream_path, function (err, mp4s) {
          if (err) {
            logger.warn(err);
            return next(null);
          }
          logger.debug('MP4s:');
          logger.debug(mp4s);
          if (mp4s.length==0) {
            logger.debug('skipping empty');
            return next(null);
          }
          var done = 0;
          for (var i=0; i<mp4s.length; i++) {
            logger.log('Archiving: %s', mp4s[i]);
            var file_path = path.join(__dirname, '../public/videos/live', stream_name, mp4s[i]);
            var file_path_archived = path.join(__dirname, '../public/videos/archived', stream_name, mp4s[i].toLowerCase());
            logger.debug('file_path: %s', file_path);
            logger.debug('file_path_archived: %s', file_path_archived);
            fss.moveSync(file_path, file_path_archived);
            var newVideo = new Video({'title':mp4s[i],'path':file_path_archived,'isOriginal':true});
            newVideo.save(function (err) {
              if (err) logger.warn(err);
              done++;
              if (done==mp4s.length)
                next(null);
            });
          }
        });
      });
    series.push(function (next) {
      logger.log('Archiving Complete');
      callback(null);
    });
    async.series(series);
  });
}

videoSchema.statics.createPreviews = function(callback) {
  logger.log('Creating Video Previews');
  Video.find({'isOriginal':true,'hasPreview':false}, function (err, videos) {
    if (err) return callback(err);
    logger.log('Generating Previews: %s', videos.length);
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

videoSchema.statics.processPublished = function(callback) {
  logger.log('Processing Published Video');
  Video.archiveVideos(function (err) {
    if (err) return callback(err);
    Video.createPreviews(function (err) {
      if (err) return callback(err);
      logger.log('Processed Published Videos');
      callback(null);
    });
  });
}

// get file at location
// convert to preview
// save ref
videoSchema.methods.createPreview = function(callback) {
  var self = this;
  logger.debug('Creating Preview: %s', self.title);
  self.convert(function (err, newFile) {
    if (err) return callback(err);
    self.hasPreview = true;
    self.path_preview = newFile;
    self.save(function (err) {
      callback(err);
    });
  });
}

// edit video into 10 sec preview with watermark
videoSchema.methods.convert = function(callback) {
  var self = this;
  logger.log('--- Converting: %s', self.title);
  logger.log(self.path);
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
        step(err, file);
      });
    },
    function (file, step) {
      // create png of early frames of .mp4 path
      logger.log('--- Thumbnailing ---');
      self.thumbnail(function (err) {
        step(err, file);
      });
    },
    function (file, step) {
      logger.log('--- Conversion Complete: %s', self.title);
      callback(null, file);
    }
  ], function (err) {
    callback(err);
  });
}

videoSchema.methods.extract = function(callback) {
  logger.log('Extracting: %s', this.title);
  logger.debug('path: %s', this.path);
  var duration = Math.round(this.duration);
  if (duration>config.defaultPreviewDuration) duration = config.defaultPreviewDuration;
  logger.debug('Duration: %s', duration);
  var newTitle = path.basename(this.path.toLowerCase().replace('.mp4','-preview.mp4'));
  var newFile = path.join(__dirname, '../public/videos/previews', newTitle);
  logger.debug('New File: %s', newFile);
  logger.debug('New Title: %s', newTitle);
  var conversion_process = new FFmpeg({ 'source': this.path, 'timeout': 0 });
  conversion_process
      .inputOptions('-probesize 100')
      .inputOptions('-analyzeduration 10000000')
      .withVideoBitrate(1024)
      .withAspect('16:9')
      .withFps(30)
      .withAudioBitrate('128k')
      .withAudioCodec('aac')
      .toFormat('mp4')
      .duration(duration)
      .outputOptions('-max_muxing_queue_size 99999')
      .outputOptions('-flags +global_header')
      .outputOptions('-scrict -2')
    .on('start', function (commandLine) {
      logger.log("Extraction Started");
    })
    .on('error', function (err, stdout, stderr) {
      logger.log("Extraction Failed"); 
      if (stdout)
        logger.log("stdout:\n" + stdout);
      if (stderr)
        logger.log("stderr:\n" + stderr);
      callback(err);
    })
    .on('progress', function (progress) {
        process.stdout.write('Extracting: '+Math.round(progress.percent)+'%\033[0G');
    })
    .on('end', function () {
      logger.log("Extraction Finished");
      callback(null, newFile);
    })
    .saveToFile(newFile); 
}

videoSchema.methods.thumbnail = function(callback) {
  var self = this;
  logger.log('Creating Thumbnail: %s', self.path);
  var filename = path.basename(self.path).split('.')[0]+'.png';
  var foldername = path.join(__dirname, '../public/images/thumbnails');
  logger.debug('filename: %s', filename);
  logger.debug('foldername: %s', foldername);
  var proc = new FFmpeg(self.path)
  // .on('filenames', function(filenames) {
  //   logger.log('Will generate: ' + filenames.join(', '))
  // })
  .on('end', function() {
    // logger.debug('screenshots taken');
    self.path_image = path.join(__dirname, '../public/images/thumbnails', path.basename(self.path).replace('.mp4','.png'));
    self.save(function (err) {
      if (err) return callback(err);
      logger.log('thumbnail saved: %s', filename);
      callback(null);
    });
    
  })
  .thumbnails({
      count: 1,
      // timemarks: [ '1' ], // number of seconds
      filename: filename,
      folder: foldername
  });
}

videoSchema.methods.watermark = function(callback) {
  var self = this;
  logger.log('Watermarking: %s', self.title);
  var conversion_process = new FFmpeg({ 'source': self.path, 'timeout': 0 });
  conversion_process
    .inputOptions('-probesize 100')
    .inputOptions('-analyzeduration 10000000')
    .input(path.join(__dirname, "../public/images/watermark.png"))
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
      .outputOptions('-max_muxing_queue_size 99999')
      .outputOptions('-flags +global_header')
      .outputOptions('-scrict -2')
    .on('start', function (commandLine) {
      logger.log("Watermarking Started");
    })
    .on('error', function (err, stdout, stderr) {
      logger.log("Watermarking Failed");
      if (stdout)
        logger.log("stdout:\n" + stdout);
      if (stderr)
        logger.log("stderr:\n" + stderr);
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
    .saveToFile(self.path); 
}

var Video = mongoose.model('videos', videoSchema,'videos');
module.exports = Video;