var config = require('../config/index'),
    logger = config.logger,
    base64url = require('base64url'),
    App = require('../models/app'),
    async = require('async');

var authenticated = false; // 6 hour expiration
// var authTimeout;

const {GoogleApis} = require('googleapis');
const google = new GoogleApis();

// var OAuth2 = google.auth.OAuth2,
//     oauth2Client = new OAuth2(config.Google_client_id, config.Google_client_secret, config.Google_redirect);

// var Gmail = google.gmail({
//   'version': 'v1',
//   'auth': oauth2Client
// });

var Gmail = google.gmail({
  'version': 'v1',
  'auth': config.Google_jwtClient
});

function authorize(callback) {
  config.Google_jwtClient.authorize(function (err, tokens) {
    if (err) return callback(err);
    logger.log("Google authorized - Gmail");
    authenticated = true;
    Gmail = google.gmail({
      version: 'v1',
      auth: config.Google_jwtClient
    });
    callback(null);
  });

  // logger.log('authenticating Google - Gmail');
  // App.findOne({},function (err, app) {
  //   if (err) return callback(err);
  //   if (!app) return callback('Missing app!');
  //   if (app.google&&!app.google.access_token&&app.google.refresh_token) return refreshAccess(callback);
  //   if (app.google&&!app.google.access_token&&!app.google.refresh_token) return callback('Missing Google Tokens: Please Login');
  //   oauth2Client.setCredentials({
  //     'access_token': app.google.access_token,
  //     'refresh_token': app.google.refresh_token
  //   });
  //   Gmail = google.gmail({
  //     'version': 'v1',
  //     'auth': oauth2Client
  //   });
  //   logger.debug('Google authorized - Gmail');
  //   callback(null);
  //   authenticated = true;
    
  // });
}
module.exports.authorize = authorize;

function refreshAccess(callback) {
  // logger.log('refreshing Google - Gmail');
  // App.findOne({},function (err, app) {
  //   if (err) return callback(err);
  //   if (app.google&&!app.google.access_token&&!app.google.refresh_token) return callback('Missing Google Tokens: Please Login');
  //   oauth2Client.refreshAccessToken(function (err, tokens) {
  //     if (err) return callback(err);
  //     logger.debug('google tokens: %s',JSON.stringify(tokens,null,4));
  //     app.google.access_token = tokens.access_token;
  //     app.google.refresh_token = tokens.refresh_token;
  //     oauth2Client.setCredentials({
  //       'access_token': app.google.access_token,
  //       'refresh_token': app.google.refresh_token
  //     });
  //     Gmail = google.gmail({
  //       'version': 'v1',
  //       'auth': oauth2Client
  //     });
  //     app.save(function (err) {
  //       if (err) return logger.warn(err);
  //       logger.debug('Google refreshed - Gmail');
  //       callback(null);
  //     });
  //   });
  // });
}

function sendEmail(email, callback) {
  async.series([
    function (next) {
      if (!config.emailing) return next('Email disabled!');
      if (authenticated) return next(null);
      authorize(next);
    },
    function (next) {
      var message = "" 
        + "Content-type: text/html;charset=iso-8859-1" + "\n"
        + "From: "+email.from + "\n"
        + "To: "+email.to + "\n"
        + "Subject: "+email.subject + "\n\n"
        + email.text;
      logger.log('message: %s', message);
      message = base64url(message);
      logger.log('encoded: %s', message);
      Gmail.users.messages.send({
        userId: 'me',
        resource: {
          raw: message
        }
      }, function (err, response) {
        if (err) return next(err);
        logger.log('email sent: %s <- %s: %s', email.to, email.from, email.subject);  
        return callback(null);
      });
    },
  ],function (err) {
    if (err&&err.message) logger.warn(err.message);
    else if (err) logger.warn(err);
    callback('Email Systems Down!');
  });
}
module.exports.sendEmail = sendEmail;

function notifyNewAccount(callback) {
  async.series([
    function (next) {
      if (!config.emailing) return next('Email disabled!');
      if (!config.emailing_on_new) return next('Skipping New Account Email!');
      if (authenticated) return next(null);
      authorize(next);
    },
    function (next) {
      var email = config.email_account_created();
      sendEmail(email, function (err) {
        if (err) return next(err);
        logger.log('New Account Email sent!');
        callback(null);
      });
    },
  ],function (err) {
    if (err) logger.warn(err.message);
    callback('Email Systems Down!');
  });
}
module.exports.notifyNewAccount = notifyNewAccount;

function notifyError(callback) {
  async.series([
    function (next) {
      if (!config.emailing) return next('Email disabled!');
      if (!config.emailing_on_error) return next('Skipping Error Email!');
      if (authenticated) return next(null);
      authorize(next);
    },
    function (next) {
      var email = config.email_error(config.email_self);
      sendEmail(email, function (err) {
        if (err) return next(err);
        logger.log('Error Email sent!');
        callback(null);
      });
    },
  ],function (err) {
    if (err) logger.warn(err.message);
    callback('Email Systems Down!');
  });
}
module.exports.notifyError = notifyError;