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
var videoSchema = new Schema({
  archived: { type: Boolean, default: false }, // unused. should be for older videos that are now for free
  backedUp: { type: Boolean, default: false },
  date: { type: String, default: moment(new Date()).format('MM-DD-YYYY') },
  description: { type: String, default: '' },
  duration: { type: Number },
  hasPreview: { type: Boolean, default: false },
  isOriginal: { type: Boolean, default: false },
  link: { type: String, default: config.Twitter_link },
  path: { type: String },
  path_preview: { type: String },
  path_image: { type: String },
  performers: { type: Array, default: [] },
  price: { type: Number },
  title: { type: String },
  uploaded: { type: Boolean, default: false }
});

videoSchema.pre('save', function (next) {
  var self = this;
  if (!self.path) return next('Missing path!');
  if (!self.path_preview)
    self.path_preview = path.join(config.videosPath, '/previews', self.path.replace('.mp4','-preview.mp4'));
  // if (self.title) {
  if (self.title!='Example') {
    var title = path.basename(self.path.toLowerCase().replace('.mp4','').replace('.flv',''));
    var time = title.substring(11);
    title = title.substring(0,10);
    // logger.debug('time: %s | %s', title, time);
    //////
    var date = moment(new Date(title));
    var month = date.month()+1;
    var day = date.date()+1;
    var year = date.year();
    //////
    // var month = moment(new Date(title)).month()+1;
    // var day = moment(new Date(title)).date()+1;
    // var year = moment(new Date(title)).year();
    //////
    var hours = time.substring(0,2);
    var minutes = time.substring(3,5);
    // logger.debug('%s:%s:%s %s:%s', month, day, year, hours, minutes);
    title = month+"-"+day+"-"+year+" "+hours+":"+minutes;
    if (title.toLowerCase().indexOf("nan")>-1) {
      self.date = new moment(new Date())
      self.title = path.basename(self.path.toLowerCase().replace('.mp4','').replace('.flv',''));
    }
    else {
      self.date = new moment(new Date(year,month-1,day)).format("MM-DD-YYYY");
      self.title = title;
    }
  }
  if ((self.isModified('description')||self.isModified('performers'))&&self.performers)
    self.description = [self.performers.slice(0, -1).join(', '), self.performers.slice(-1)[0]].join(self.performers.length < 2 ? '' : ' and ');
  if (!self.path)
    self.path = path.join(config.videosPath, 'archive/stream', self.title+'.mp4');
  async.series([
    function (step) {
      // duration check
      if (self.duration) return step(null);
      logger.debug('probing duration...');
      // ffprobe video for duration
      retried = false;
      (function probe() {
        FFmpeg.ffprobe(self.path, function(err, metadata) {
          if (err) {
            logger.warn(err);
            if (err.message.indexOf('Invalid data found when processing input')>-1&&!retried) {
              logger.debug('-- missing moov atom --');
              return self.repairMoov(function (err) {
                if (err) {
                  logger.warn(err);
                  logger.warn('Missing duration: %s', self.title);
                  self.duration = 0;
                  return step(null);
                }
                logger.debug('retrying probe...');
                retried = true;
                probe()
              });
            }
          }
          if (metadata) {
            logger.debug('duration: %s', metadata.format.duration);
            self.duration = metadata.format.duration;
          } 
          else {
            logger.warn('Missing duration');
            self.duration = 0;
          }
          step(null);
        });
      })()
    },
    function (step) {
      if (self.isModified('duration')||self.isModified('price')||!self.price) {
        if (self.duration<config.defaultPrice) { // 5 minutes / default time
          self.price = config.defaultPrice;
          logger.debug('minimum price set: %s', self.price);
        }
        else if (self.duration) {
          self.price = self.duration;
          logger.debug('price set: %s', self.price);
        }
        else
          self.price = config.defaultPrice;
        // self.price = Math.round(self.price * 100) / 100;
        self.price = Math.round(self.price);
      }
      // Normal
      logger.debug('Video Saved: %s', self.title);
      next();
    }
  ]);
});

// move any mp4s from public/videos/live/stream -> public/videos/archived
videoSchema.statics.archiveVideos = function(callback) {
  var fs = require('fs');
  logger.log('Archiving Videos');
  async.waterfall([
    function (step) {
      streams = [...fs.readdirSync(path.join(config.videosPath, 'live/'))]
      // logger.debug('streams: %s', streams);
      step(null, streams);
    },
    function (streams, step) {
      var newVideos = [];
      var series = [];
      _.forEach(streams, function (stream_name) {
        // mp4s in directories
        var stream_path = path.join(config.videosPath, '/live/', stream_name);
        var archived_path = path.join(config.videosPath, '/archived/', stream_name);
        // logger.debug('stream_name: %s', stream_name);
        // logger.debug('stream: %s', stream_name);
        // logger.debug('stream_path: %s', stream_path);
        // logger.debug('archived_path: %s', archived_path);
        fss.ensureDirSync(path.join(config.videosPath, '/archived/', stream_name), "0o2775");
        // fss.ensureSymlinkSync(path.join(config.videosPath, 'archived', stream_name), archived_path);
        var mp4s = fs.readdirSync(stream_path)
        if (mp4s.length==0) return logger.debug("No Videos Found");
        for (var i=0; i<mp4s.length; i++) {
          try {
            logger.log('Archiving: %s', mp4s[i]);
            var file_path = path.join(config.videosPath, '/live/', stream_name, mp4s[i]);
            var file_path_archived = path.join(config.videosPath, '/archived/', stream_name, mp4s[i].toLowerCase());
            // logger.debug('file_path: %s', file_path);
            // logger.debug('file_path_archived: %s', file_path_archived);
            fss.moveSync(file_path, file_path_archived);
            var newVideo = new Video({'path':file_path_archived,'isOriginal':true});
            newVideos.push(newVideo);
          }
          catch (error) {
            logger.warn(error);
          }
        }
      });
      step(null, newVideos);
    },
    function (newVideos, step) {
      var series = [];
      _.forEach(newVideos, function (video) {
        series.push(function (next) {
          video.save(function (err) {
            if (err) {
              logger.warn(err);
              return next(null);
            }
            video.archive(function (err) {
              if (err) logger.warn(err);
              next(null);
            });
          });
        });
      });
      series.push(function (next) {
        step(null);
      });
      async.series(series);
    },
    function (step) {
      logger.log('Archiving Complete');
      callback(null);
    }
  ],
  function (err) {
    logger.log("Archiving Interrupted");
    if (err) logger.warn(err);
    callback(null);
  });
}

videoSchema.statics.concatLives = function(callback) {
  if (!config.concatting) return callback("Skipping Concat");
  // concat them all using ffmpeg
  // output to same location
  var fs = require('fs');
  logger.log('Concating MP4s');
  // get all mp3s in whatever folder that is
  fs.readdir(path.join(config.videosPath, 'live/'), function (err, streams) {
    if (err) {
      logger.warn(err);
      return callback(null);
    }
    logger.debug('streams: %s', streams);
    var mergedVideo = FFmpeg();
    var videoNames = [];
    var streamName = "";
    streams.forEach(function (stream) {
      if (streamName=="") streamName = stream;
      videoNames.push(path.join(config.videosPath, '/live/', stream));
    });
    logger.log("stream name: "+streamName);
    videoNames.forEach(function(videoName){
        mergedVideo = mergedVideo.addInput(videoName);
    });
    mergedVideo.mergeToFile(path.join(config.videosPath, '/live/',streamName))
    .on('error', function(err) {
      logger.warn('Error ' + err.message);
      callback(null);
    })
    .on('end', function() {
      logger.log('Concatenation Completed');
      callback(null);
    });
  });
}

videoSchema.statics.createPreviews = function(callback) {
  logger.log('Creating Video Previews...');
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

videoSchema.statics.deleteMissing = function(callback) {
  logger.log('Deleting Missing Videos...');
  fs.readdir(path.join(config.videosPath, '/archived/stream'), function (err, files) {
    if (err) return callback(err);
    Video.find({'isOriginal':true,'title':{'$ne':'Example'}}, function (err, videos) {
      if (err) return callback(err);
      for (var i=0;i<files.length;i++) 
        for (var j=0;j<videos.length;j++) {
          if (files[i]==path.basename(videos[j].path)) {
            // logger.log('file: %s | %s :video', files[i],path.basename(videos[j].path));
            videos.splice(j,1);
          }
        }
      var series = [];
      _.forEach(videos, function (video) {
        series.push(function (step) {
          logger.debug("deleting: %s", video.title)
          // fs.unlinkSync(video.path);
          // fs.unlinkSync(video.preview_path);
          video.remove(function (err) {
            if (err) logger.warn(err);
            step(null);
          });
        });
      });
      series.push(function (step) {
        logger.debug('Deleted Missing: %s', videos.length);
        callback(null);
      });
      async.series(series);
    });
  });
}

videoSchema.statics.deleteOnPublish = function(callback) {
  var stream_path = path.join(config.videosPath, '/live/stream');
  fs.readdir(stream_path, function(err, items) {
    if (!items) return logger.warn("no streams found to delete");
    for (var i=0; i<items.length; i++) {
      fs.unlinkSync(path.join(config.videosPath, '/live/stream', items[i]));
      logger.debug('deleted: %s', items[i]);
    }
    callback(null);
  });
}

videoSchema.statics.populateFromFiles = function(callback) {
  logger.log('Populating Video Database...');
  // read videos/archived for all the files
  var videoFiles = fs.readdirSync(config.videosPath+'/archived/stream');
  logger.debug('videoFiles: %s', videoFiles);
  // create a video model for each
  var series = [];
  _.forEach(videoFiles, function (video) {
    series.push(function (step) {
      var videoPath = path.join(config.videosPath, '/archived/stream', video);
      logger.debug('videoPath: %s', videoPath);
      Video.findOne({'path':videoPath}, function (err, video_) {
        if (err) {
          logger.warn(err);
          return step(null);
        }
        if (video_) {
          return video_.save(function (err) {
            if (err) logger.warn(err);
            logger.log('Existing video: %s', video_.title);
            step(null);
          });
        }
        var newVideo = new Video({'isOriginal':true,'path':videoPath});
        newVideo.save(function (err) {
          if (err) logger.warn(err);
          logger.log('Populated video: %s', newVideo.title);
          step(null);
        });
      });
    });
  });
  series.push(function (step) {
    logger.log('Video DB Repopulated');
    callback(null);
  });
  async.series(series);
}

videoSchema.statics.processPublished = function(callback) {
  logger.log('Processing Published Video...');
  Video.archiveVideos(function (err) {
    if (err) return callback(err);
    Video.createPreviews(function (err) {
      if (err) return callback(err);
      logger.log('Processed Published Videos');
      callback(null);
    });
  });
}

videoSchema.methods.archive = function(callback) {
  var self = this;
  logger.debug("Archiving: %s", self.title);
  async.series([
    function (step) {
      if (!config.Twitter_tweet_on_archive) return step(null);
      var Twitter = require('../modules/twitter');
      Twitter.tweetOnArchive(self, function (err) {
        if (err) logger.warn(err);
        step(null);
      });
    },
    function (step) {
      if (!config.backup_on_archive) return step(null);
      self.backup(function (err) {
        if (err) logger.warn(err);
        step(null);
      });
    },
    function (step) {
      if (!config.upload_on_archive) return step(null);
      self.upload(function (err) {
        if (err) logger.warn(err);
        step(null);
      });
    },
    function (step) {
      logger.debug("Archiving Complete: %s", self.title);
      callback(null);
    }
  ])
}

// uploads to Google Drive - OnlyFans folder
videoSchema.methods.backup = function(callback) {
  var self = this;
  if (!config.backup) return callback(`Skipping Backup: ${this.title}`);
  logger.log('Backing up: %s', self.title);
  if (self.backedUp) {
    logger.debug('Skipping Backup: Already Backed Up');
    return callback(null);
  }
  require('../modules/drive').backupVideo(self, function (err) {
    if (err) return callback(err);
    logger.log('Backed Up: %s', self.title);
    self.backedUp = true;
    self.save(function (err) {
      if (err) logger.warn(err);
      if (config.delete_on_backup)
        self.delete(callback)
      else
        callback(null);
    });
  });
}

// get file at location
// convert to preview
// save ref
videoSchema.methods.createPreview = function(callback) {
  var self = this;
  if (!config.createPreviews) {
    logger.debug("Skipping Create Preview: %s", self.title)
    return callback(null);
  }
  logger.log('Creating Preview: %s', self.title);
  logger.debug(self.path);
  async.waterfall([
    function (step) {
      // create png of early frames of .mp4 path
      logger.log('--- Thumbnailing ---');
      self.thumbnail(function (err) {
        if (err) {
          logger.warn(err);
          if (err.message.indexOf('No such file or directory')>-1) {
            logger.debug('-- missing file --');
          }
          else if (err.message.indexOf('Invalid data found when processing input')>-1) {
            logger.debug('-- missing moov atom --');
            return self.repairMoov(function (err_) {
              step(err_);
            });
          }
        }
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
          else if (err.message.indexOf('Conversion failed!')>-1) {
            logger.debug('-- retrying muxing extraction 2 --');
            return self.extract(function (err, file) {
              step(err, file);
            },'muxing');
          }
          else if (err.message.indexOf('No such file or directory')>-1) {
            logger.debug('-- missing file --');
          }
          else if (err.message.indexOf('Invalid data found when processing input')>-1) {
            logger.debug('-- missing moov atom --');
            return self.repairMoov(function (err_) {
              step(err_, file);
            });
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

videoSchema.methods.delete = function(callback) {
  logger.log("Deleting Video File: %s", this.title)
  // delete from filesystem
  fs.unlinkSync(this.path)
  // remove from db
  if (!config.database_retain) {
    print("Deleting Video from DB (%s): %s", config.database_type, this.title)
    this.remove(function (err) {
      if (err) logger.warn(err);
      callback(null);
    });
  }
}

videoSchema.methods.extract = function(callback, retryReason) {
  logger.log('Extracting: %s', this.title);
  logger.debug('path: %s', this.path);
  var duration = Math.round(this.duration);
  if (duration>config.defaultPreviewDuration) duration = parseInt(config.defaultPreviewDuration, 10);
  logger.debug('Duration: %s:%s', duration, this.duration);
  var newTitle = path.basename(this.path.toLowerCase().replace('.mp4','-preview.mp4'));
  var newFile = path.join(config.videosPath, '/previews/', newTitle);
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
    if (config.debugging)
      process.stdout.write('Extracting...\033[0G');
  })
  .on('end', function () {
    logger.log("Extraction Finished");
    callback(null, newFile);
  })
  .saveToFile(newFile); 
}

videoSchema.methods.sendPurchasedEmail = function(callback) {
  if (!config.emailing_on_buy) return callback(null);
  logger.log('Sending Video Purchased Email: %s', this._id);
  var mailOptions = config.email_video_purchased(this);
  require('../modules/gmail').sendEmail(mailOptions, function (err) {
    callback(err);
  });
}

videoSchema.methods.repairMoov = function(callback) {
  if (config.repair_moov==false) return callback("Warning: Skipping Moov Repair");
  var self = this;
  logger.log('Repairing Moov: %s', self.title);
  if (!fs.existsSync(config.workingVideoPath))
    return callback("Warning: Missing Working Video Path");
  const { spawn } = require('child_process');
  const child = spawn('untrunc', [config.workingVideoPath, self.path]);
  child.stdout.on('data', function (data) {
    // logger.log(data.toString());
  });
  child.on('exit', code => {
    // logger.log(`Exit code is: ${code}`);
    path_name = self.path+"_fixed.mp4";
    if (!fs.existsSync(path_name))
      return callback("Missing Repaired File: "+self.title);
    fs.renameSync(path_name, self.path);
    // cannot save because this is being called from save but everything else will save it anyways, hopefully
    callback(null);
  });
}

videoSchema.methods.thumbnail = function(callback) {
  var self = this;
  logger.log('Creating Thumbnail: %s', self.path);
  var filename = path.basename(self.path).split('.')[0]+'.png';
  var foldername = path.join(config.imagesPath, '/thumbnails/');
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
    self.path_image = path.join(config.imagesPath, '/thumbnails/', path.basename(self.path).replace('.mp4','.png'));
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
    if (config.debugging)
      process.stdout.write("Watermarking...\033[0G");
  })
  .on('end', function () {
    logger.log("Watermarking Finished");
    logger.log('--- Watermarked: %s', self.title);
    callback(null);
  })
  .saveToFile(self.path_preview.replace('.mp4', '-w.mp4'));
  // .saveToFile(self.path_preview); 
}

videoSchema.methods.upload = function(callback) {
  var self = this;
  if (!config.upload_to_OnlyFans) return callback('Skipping OnlyFans Upload');
  // if (self.uploaded) return callback("Video already uploaded")
  logger.log("Uploading : "+self.title);
  var OnlyFans = require('../modules/onlyfans');
  var path_ = self.path;
  if (path_.indexOf(config.videosPath)==-1)
    path_ = path.join(config.videosPath, 'archived/stream', path_);
  logger.debug(path_)
  OnlyFans.spawn(['-action','post','-text',`DeezNuts - ${self.title}`,'-keywords','deeznuts','-force-upload', path_], 
    function (err) {
      if (err) {
        if (config.backup_on_failure_to_upload) {
          // attempt to backup for later upload
          return self.backup(function (err) {
            callback(err);
          })
        }
        return callback(err)
      }
      self.uploaded = true;
      self.save(function (err) {
        logger.log("Upload Successful");
        callback(err);
      });
    }
  );
}

videoSchema.set('redisCache', true);
var Video = mongoose.model('videos', videoSchema,'videos');
module.exports = Video;