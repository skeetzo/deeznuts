var _ = require('underscore'),
    config = require('../config/index'),
    fs = require('fs'),
    logger = config.logger,
    App = require('../models/app'),
    async = require('async');

var authenticated = false; // 6 hour expiration
var authTimeout;

// const {GoogleApis} = require('googleapis');
// const google = new GoogleApis();
var {google} = require('googleapis');

// var OAuth2 = google.auth.OAuth2,
    // oauth2Client = new OAuth2(config.Google_client_id, config.Google_client_secret, config.Google_redirect);

// var Google_Drive = google.drive({
//   'version': 'v3',
//   'auth': oauth2Client
// });

// var Google_Oauth_Opts = {};
// var local_keys_path = "../keys/dbot-keys.json";
// Google_Oauth_Opts = fs.readFileSync(local_keys_path).toString();
// Google_Oauth_Opts = JSON.parse(Google_Oauth_Opts);

// var Google_scopes = ['https://www.googleapis.com/auth/drive'];
var Google_Drive;
// var Google_jwtClient = new google.auth.JWT(
//      Google_Oauth_Opts.client_email,
//      null,
//      Google_Oauth_Opts.private_key,
//      Google_scopes);

// authenticate request
// config.Google_jwtClient.authorize(function (err, tokens) {
//   if (err) return console.error(err);
//   console.log("Successfully authorized Google!");
//   authenticated = true;
//   Google_Drive = google.drive({
//     version: 'v3',
//       auth: config.Google_jwtClient
//   });
// });



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
    clearTimeout(authTimeout);
    authTimeout = setTimeout(function authExpire() {
      logger.debug('Google authentication - Drive; expired');
      authenticated = false;
    },1000*60*60*6) // 6 hours
    callback(null);
  });

  // logger.log('authenticating Google - Drive');
  // App.findOne({}, function (err, app) {
  //   if (err) logger.warn(err);
  //   if (!app.google.access_token&&app.google.refresh_token) return refreshAccess(callback);
  //   if (!app.google.access_token&&!app.google.refresh_token) {
  //     return callback('Missing Google Tokens: Please Login');
  //   }
  //   oauth2Client.setCredentials({
  //     'access_token': app.google.access_token,
  //     'refresh_token': app.google.refresh_token
  //   });
  //   Google_Drive = google.drive({
  //     version: 'v3',
  //     auth: oauth2Client
  //   });
  //   logger.log('Google authenticated - Drive');
  //   authenticated = true;
    clearTimeout(authTimeout);
    authTimeout = setTimeout(function authExpire() {
      logger.debug('Google authentication - Drive; expired');
      authenticated = false;
    },1000*60*60*6) // 6 hours
  //   callback(null);  
  // });
}
module.exports.authenticate = authenticate;

// function refreshAccess(callback) {
//   // logger.log('refreshing Google - Drive');
//   App.findOne({}, function (err, app) {
//     if (err) return callback(err);
//     if (!app.google.access_token&&!app.google.refresh_token) return callback('Missing Google Tokens: Please Login');
//     oauth2Client.refreshAccessToken(function (err, tokens) {
//       if (err) return callback(err);
//       // logger.log('(%s) tokens: %s',JSON.stringify(tokens,null,4));
//       app.google.access_token = tokens.access_token;
//       app.google.refresh_token = tokens.refresh_token;
//       oauth2Client.setCredentials({
//         'access_token': app.google.access_token,
//         'refresh_token': app.google.refresh_token
//       });
//       Google_Drive = google.drive({
//         version: 'v3',
//         auth: oauth2Client
//       });
//       app.save(function (err) {
//         if (err) return logger.warn(err);
//         logger.log('Google refreshed - Drive');
//         callback(null);
//       });
//     });
//   });
// }

// Functions
var path = require('path');
// upload file at path to OnlyFans folder
function backupVideo(video, callback) {
  return callback('Skipping!');
  async.waterfall([
    function auth(step) {
      if (authenticated) return step(null);
      authenticate(step);
    },
    function (step) {
      logger.log('Uploading to OnlyFans folder: %s', video.title);
      if (video.path.indexOf(config.videosPath)==-1)
        video.path = path.join(config.videosPath, 'archived/stream', video.path);
      logger.debug(video.path);
      // file is string of path
      var fileMetadata = {
        'name': video.title,
        'parents': [config.driveFolderId],
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
      }, function(err) {
        callback(err);
      });
    }
  ], function (err) {
    callback(err);
  });
}
module.exports.backupVideo = backupVideo;