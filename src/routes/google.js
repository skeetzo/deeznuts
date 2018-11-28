var config = require('../config/index'),
    logger = config.logger,
    mixins = require('../modules/mixins');

const {GoogleApis} = require('googleapis');
const google = new GoogleApis();
var OAuth2 = google.auth.OAuth2,
    oauth2Client = new OAuth2(config.Google_client_id, config.Google_client_secret, config.Google_redirect);

module.exports = function googleRoutes(router) {
  // Google Drive Authorize
  router.get('/google/authorize', mixins.loggedInDeezNuts, function (req, res) {
    var App = require('../models/app');
    App.findOne({},function (err, app) {
      if (err) {
        logger.warn(err);
        req.flash('error','Error!');
        return res.redirect('/');
      }
      if (!app) {
        app = new App();
        app.save();
      }
      logger.log('authorizing Google');
      var Google_url = oauth2Client.generateAuthUrl({
        // 'online' (default) or 'offline' (gets refresh_token)
        access_type: 'offline',
        // If you only need one scope you can pass it as a string
        scope: config.Google_scopes,
        // Optional property that passes state parameters to redirect URI
        // state: { foo: 'bar' }
        login_hint: config.gmail_user,
        prompt: 'consent',
        // approval_prompt: "force",
      });
      res.redirect(Google_url);
    });
  });

  // Google Authorize redirect
  router.get('/google/callback', function (req, res, next) {
    var App = require('../models/app');
    App.findOne({},function (err, app) {
      if (err) {
        logger.warn(err);
        req.flash('error','Error!');
        return res.redirect('/');
      }
      // logger.debug('query: %s',JSON.stringify(req.query));
      oauth2Client.getToken(req.query.code, function (err, tokens) {
        if (err) {
          logger.warn(err);
          req.flash('error','Error authorizing!');
          return res.redirect('/');
        }
        logger.debug('tokens: %s',JSON.stringify(tokens,null,4));
        if (!app) app = new App();
        app.google.access_token = tokens.access_token;
        app.google.refresh_token = tokens.refresh_token;
        logger.log('authorized Google');
        req.flash('message','Authorized!');
        app.save(function(err) {
          if (err) logger.warn(err);
          res.redirect('/');
        });
      });
    });
  });
}