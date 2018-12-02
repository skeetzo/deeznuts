var _ = require('underscore'),
    config = require('../config/index'),
    fs = require('fs'),
    logger = config.logger,
    App = require('../models/app'),
    async = require('async');

var authenticated = false; // 6 hour expiration
var authTimeout;

const {GoogleApis} = require('googleapis');
const google = new GoogleApis();

var OAuth2 = google.auth.OAuth2,
    oauth2Client = new OAuth2(config.Google_client_id, config.Google_client_secret, config.Google_redirect);

var Google_Drive = google.drive({
  'version': 'v3',
  'auth': oauth2Client
});

// Authentication

function authenticate(callback) {
  // logger.log('authenticating Google - Drive');
  App.findOne({}, function (err, app) {
    if (err) logger.warn(err);
    if (!app.google.access_token&&app.google.refresh_token) return refreshAccess(callback);
    if (!app.google.access_token&&!app.google.refresh_token) {
      return callback('Missing Google Tokens: Please Login');
    }
    oauth2Client.setCredentials({
      'access_token': app.google.access_token,
      'refresh_token': app.google.refresh_token
    });
    Google_Drive = google.drive({
      version: 'v3',
      auth: oauth2Client
    });
    logger.log('Google authenticated - Drive');
    authenticated = true;
    clearTimeout(authTimeout);
    authTimeout = setTimeout(function authExpire() {
      logger.debug('Google authentication - Drive; expired');
      authenticated = false;
    },1000*60*60*6) // 6 hours
    callback(null);  
  });
}
module.exports.authenticate = authenticate;

function refreshAccess(callback) {
  // logger.log('refreshing Google - Drive');
  App.findOne({}, function (err, app) {
    if (err) return callback(err);
    if (!app.google.access_token&&!app.google.refresh_token) return callback('Missing Google Tokens: Please Login');
    oauth2Client.refreshAccessToken(function (err, tokens) {
      if (err) return callback(err);
      // logger.log('(%s) tokens: %s',JSON.stringify(tokens,null,4));
      app.google.access_token = tokens.access_token;
      app.google.refresh_token = tokens.refresh_token;
      oauth2Client.setCredentials({
        'access_token': app.google.access_token,
        'refresh_token': app.google.refresh_token
      });
      Google_Drive = google.drive({
        version: 'v3',
        auth: oauth2Client
      });
      app.save(function (err) {
        if (err) return logger.warn(err);
        logger.log('Google refreshed - Drive');
        callback(null);
      });
    });
  });
}

// Functions

// upload file at path to OnlyFans folder
function backupVideo(video, callback) {
  async.waterfall([
    function auth(step) {
      if (authenticated) return step(null);
      authenticate(step);
    },
    function (step) {
      logger.log('Uploading to OnlyFans folder: %s', video.title);
      // file is string of path
      var mimeType = "video/mp4";
      var fileMetadata = {
        'name': video.title,
        'parents': [config.driveFolderId],
        'uploadType': 'resumable'
      };
      var media = {
        mimeType: mimeType,
        body: fs.createReadStream(video.path)
      };
      Google_Drive.files.create({
         resource: fileMetadata,
         media: media,
         fields: 'id'
      }, function(err, file) {
        if (err) return callback(err)
        logger.log('Uploaded: %s', file.id);
        callback(null);
      });
    }
  ], function (err) {
    if (err) logger.warn(err);
    callback(null);
  });
}
module.exports.backupVideo = backupVideo;