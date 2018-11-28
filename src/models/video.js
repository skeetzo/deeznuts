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
  date: { type: String, default: moment(new Date()).format('MM-DD-YYYY') },
  description: { type: String, default: '' },
  duration: { type: Number },
  hasPreview: { type: Boolean, default: false },
  isOriginal: { type: Boolean, default: false },
  path: { type: String },
  path_preview: { type: String },
  path_image: { type: String },
  performers: { type: Array, default: [] },
  price: { type: Number },
  title: { type: String }
});

videoSchema.pre('save', function (next) {
  var self = this;
  if (!self.date)
    self.date = moment(new Date(self.title)).format('MM-DD-YYYY:HH:mm');
  if ((self.isModified('description')||self.isModified('performers'))&&self.performers)
    self.description = [self.performers.slice(0, -1).join(', '), self.performers.slice(-1)[0]].join(self.performers.length < 2 ? '' : ' and ');
  if (!self.path)
    self.path = path.join(__dirname, '../public/videos/archive/', self.title+'.mp4');
  if (!self.duration) {
    logger.debug('probing...');
    // ffprobe video for duration
    return FFmpeg.ffprobe(self.path, function(err, metadata) {
      if (err) return logger.warn(err);
      logger.debug('duration: %s', metadata.format.duration);
      self.duration = metadata.format.duration;
      if (self.duration<config.defaultPrice) { // 5 minutes / default time
        self.price = config.defaultPrice;
        logger.log('minimum price set: %s', self.price);
      }
      else {
        self.price = Math.round(self.duration);
        logger.log('price set: %s', self.price);
      }
      logger.debug('Video Saved: %s', self.title);
      next();
    });
  }
  if (self.isModified('duration')||self.isModified('price')||!self.price) {
    if (self.duration<config.defaultPrice) { // 5 minutes / default time
      self.price = config.defaultPrice;
      logger.log('minimum price set: %s', self.price);
    }
    else if (self.duration) {
      self.price = Math.round(self.duration);
      logger.log('price set: %s', self.price);
    }
    else
      self.price = config.defaultPrice;
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
        fss.ensureDirSync(path.join(config.videosPath, 'archived/', stream_name), "0o2775");
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
            try {
              logger.log('Archiving: %s', mp4s[i]);
              var file_path = path.join(__dirname, '../public/videos/live', stream_name, mp4s[i]);
              var file_path_archived = path.join(__dirname, '../public/videos/archived', stream_name, mp4s[i].toLowerCase());
              logger.debug('file_path: %s', file_path);
              logger.debug('file_path_archived: %s', file_path_archived);
              fss.moveSync(file_path, file_path_archived);
              var title = mp4s[i].replace('.mp4','').substring(0,10);
              var time = mp4s[i].replace('.mp4','').substring(11);
              var month = moment(new Date(title)).month()+1;
              var day = moment(new Date(title)).date()+1;
              var year = moment(new Date(title)).year();
              var hours = time.substring(0,2);
              var minutes = time.substring(3,5);
              logger.log('%s:%s:%s %s:%s', month, day, year, hours, minutes);
              title = month+"-"+day+"-"+year+" "+hours+":"+minutes;
              // var title = moment(new Date(mp4s[i].replace('.mp4','').substring(0,10))).format('MM-DD-YYYY HH:mm');
              // logger.log('title: %s', title);
              var newVideo = new Video({'title':title,'path':file_path_archived,'isOriginal':true});
              newVideo.save(function (err) {
                if (err) logger.warn(err);
                done++;
                if (done==mp4s.length)
                  next(null);
              });
            }
            catch (error) {
              logger.warn(err);
            }
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
    var j = videos.length;
    for (var i=0;i<j;i++)
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
  logger.log('Creating Preview: %s', self.title);
  logger.debug(self.path);
  async.waterfall([
    function (step) {
      // create png of early frames of .mp4 path
      logger.log('--- Thumbnailing ---');
      self.thumbnail(function (err) {
        if (err) logger.warn(err);
        step(null);
      });
    },
    function (step) {
      logger.log('--- Extracting ---');
      self.extract(function (err, file) {
        if (err) {
          if (err.message.indexOf('max_muxing_queue_size')>-1) {
            logger.debug('-- retrying muxing extraction --');
            return self.extract(function (err, file) {
              step(err, file);
            },'muxing');
          }
          else if (err.message.indexOf('filters')>-1) {
            logger.debug('-- retrying filters extraction --');
            return self.extract(function (err, file) {
              step(err, file);
            },'filters');
          }
          return step(err);
        }
        step(null, file);
      });
    },
    function (file, step) {
      self.hasPreview = true;
      self.path_preview = file;
      step(null);
    },
    function (step) {
      logger.log('--- Watermarking ---');
      self.watermark(function (err) {
        step(err);
      });
    }
  ], function (err) {
    if (err) logger.warn(err);
    else logger.log('Preview Created: %s', self.title);
    self.save(function (err) {
      callback(err);
    });
  });
}

videoSchema.methods.extract = function(callback, retryReason) {
  logger.log('Extracting: %s', this.title);
  logger.debug('path: %s', this.path);
  var duration = Math.round(this.duration);
  if (duration>config.defaultPreviewDuration) duration = parseInt(config.defaultPreviewDuration, 10);
  logger.debug('Duration: %s:%s', duration, this.duration);
  var newTitle = path.basename(this.path.toLowerCase().replace('.mp4','-preview.mp4'));
  var newFile = path.join(__dirname, '../public/videos/previews', newTitle);
  logger.debug('New File: %s', newFile);
  logger.debug('New Title: %s', newTitle);
  var outputOptions = [];
  if (retryReason&&retryReason=='muxing')
    outputOptions.push('-max_muxing_queue_size 99999');
  if (retryReason&&retryReason=='filters') {
    outputOptions.push('-pix_fmt yuv420p');
    outputOptions.push('-flags +global_header');
  }
  outputOptions.push('-strict -2');
  var conversion_process = new FFmpeg({ 'source': this.path, 'timeout': 0 })
  .inputFormat('mp4')
  .videoCodec('libx264')
  .inputOptions('-probesize 100M')
  .inputOptions('-analyzeduration 100M')
  // .withVideoBitrate(1024)
  .withAspect('16:9')
  // .withFps(30)
  // .withAudioBitrate('128k')
  // .withAudioCodec('aac')
  .toFormat('mp4')
  .duration(duration)
  .outputOptions(outputOptions)
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
      process.stdout.write('Extracting...\033[0G');
  })
  .on('end', function () {
    logger.log("Extraction Finished");
    callback(null, newFile);
  })
  .saveToFile(newFile); 
}

videoSchema.methods.sendPurchasedEmail = function(callback) {
  logger.log('Sending Video Purchased Email: %s', this._id);
  var mailOptions = config.email_video_purchased(this);
  require('../modules/gmail').sendEmail(mailOptions, function (err) {
    callback(err);
  });
}

videoSchema.methods.thumbnail = function(callback) {
  var self = this;
  logger.log('Creating Thumbnail: %s', self.path);
  var filename = path.basename(self.path).split('.')[0]+'.png';
  var foldername = path.join(__dirname, '../public/images/thumbnails');
  logger.debug('filename: %s', filename);
  logger.debug('foldername: %s', foldername);
  var proc = new FFmpeg(self.path)
  .inputOptions('-probesize 100M')
  .inputOptions('-analyzeduration 100M')
  .on('error', function (err, stdout, stderr) {
    logger.log("Thumbnailing Failed"); 
    if (stdout)
      logger.log("stdout:\n" + stdout);
    if (stderr)
      logger.log("stderr:\n" + stderr);
    callback(err);
  })
  .on('end', function() {
    self.path_image = path.join(__dirname, '../public/images/thumbnails', path.basename(self.path).replace('.mp4','.png'));
    self.save(function (err) {
      if (err) return callback(err);
      logger.log('thumbnail saved: %s', filename);
      callback(null);
    });
  })
  .thumbnails({
    count: 1,
    timemarks: [ '1' ], // number of seconds
    filename: filename,
    folder: foldername
  });
}

videoSchema.methods.watermark = function(callback) {
  var self = this;
  logger.log('Watermarking: %s', self.path);
  if (!self.path_preview) return callback('Error Watermarking Video: Missing Preview Path');
  var conversion_process = new FFmpeg({ 'source': self.path_preview, 'timeout': 0 })
  // .inputOptions('-probesize 100')
  // .inputOptions('-analyzeduration 10000000')
  .format('mp4')
  .videoCodec('libx264')
  .input(config.watermarkPath)
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
  // .outputOptions('-max_muxing_queue_size 99999')
  // .outputOptions('-flags +global_header')
  // .outputOptions('-pix_fmt yuv420p')
  .outputOptions('-strict -2')
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
    process.stdout.write("Watermarking...\033[0G");
  })
  .on('end', function () {
    logger.log("Watermarking Finished");
    logger.log('--- Watermarked: %s', self.title);
    callback(null);
  })
  // .saveToFile(self.path.replace('.mp4', '-w.mp4')); 
  .saveToFile(self.path_preview); 
}

var Video = mongoose.model('videos', videoSchema,'videos');
module.exports = Video;