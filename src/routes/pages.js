var config = require('../config/index'),
    logger = config.logger,
    _ = require('underscore'),
    mixins = require('../modules/mixins');

module.exports = function homeRoutes(router) {

  // Index
  router.get("/", function (req, res, next) {
    // if (req.url.indexOf('address')>-1||req.url.indexOf('live')>-1||req.url.indexOf('videos')>-1||req.url.indexOf('login')>-1||req.url.indexOf('logout')>-1)
      // return next(null);
    if (_.contains(config.pages, req.url.replace('/','')))
      return res.render(req.url.replace('/',''), req.session.locals);
    res.render('index', req.session.locals);
  });

  router.get("/address", mixins.loggedIn, function (req, res, next) {
    require('../models/user').generateAddress(req.session.user._id, function (err) {
      if (err) {
        logger.warn(err);
        return res.sendStatus(400);
      }
      res.status(200).send();
    });
  });

  // Add
  if (config.debugging)
    router.get("/add", mixins.loggedIn,  function (req, res, next) {
      require('../models/user').findOne({'ip':req.session.user.ip}, function (err, user) {
        if (err) logger.warn(err);
        if (!user) return res.sendStatus(404);
        // user.time_added = 60;
        var oneDollarInBTC = 0.00015;
        user.addTime(100000000*oneDollarInBTC*6, function (err) {
          if (err) logger.warn(err);
          res.sendStatus(200);
        });
      });
    });

  // Key
  router.get("/key", mixins.loggedIn, mixins.loggedInDeezNuts, function (req, res, next) {
    res.render('key', req.session.locals);
  });

  router.post("/key", function (req, res, next) {
    var phrase = req.body.phrase;
    if (phrase!='banana') return res.sendStatus(401);
    var timestamp =(Date.now() + 3600000);
    var hash = require('md5')("/live/stream-"+timestamp+"-"+config.streamKey);
    res.status(200).send({'key':timestamp+"-"+hash});
  });
}