var _ = require('underscore'),
    config = require('../config/index'),
    fs = require('fs'),
    logger = config.logger,
    async = require('async');

var authenticated = false; // 6 hour expiration

var {google} = require('googleapis');
var Google_Drive;

// Authentication
function authenticate(callback) {
  config.Google_jwtClient.authorize(function (err, tokens) {
    if (err) return callback(err);
    logger.log("Google authorized - Drive");
    authenticated = true;
    Google_Drive = google.drive({
      version: 'v3',
        auth: config.Google_jwtClient
    });
    callback(null);
  });
}
module.exports.authenticate = authenticate;

// Functions
var path = require('path');
// upload file at path to OnlyFans folder
function backupVideo(video, callback) {
  // return callback('Skipping!');
  async.waterfall([
    function auth(step) {
      if (authenticated) return step(null);
      authenticate(step);
    },
    function (step) {
      logger.log('Backing up to OnlyFans folder: %s', video.title);
      if (video.path.indexOf(config.videosPath)==-1)
        video.path = path.join(config.videosPath, 'archived/stream', video.path);
      logger.debug(video.path);
      // file is string of path
      var fileMetadata = {
        'name': video.title,
        'parents': [config.drive_folder_id],
        'uploadType': 'resumable'
      };
      var media = {
        mimeType: "video/mp4",
        body: fs.createReadStream(video.path)
      };
      Google_Drive.files.create({
         resource: fileMetadata,
         media: media,
         fields: 'id'
      }, function (err) {
        callback(err);
      });
    }
  ], function (err) {
    callback(err);
  });
}
module.exports.backupVideo = backupVideo;