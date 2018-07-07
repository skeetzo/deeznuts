var config = require('../config/index'),
    logger = config.logger,
    mixins = require('../modules/mixins'),
    User = require('../models/user');

module.exports = function homeRoutes(router) {

  // /live
  router.get("/live", mixins.loggedIn, mixins.hasPaid, function (req, res, next) {
    res.render('live', req.session.locals);    
  });

  // blockchainCallback
  //- /tip
  router.get(config.blockchainRoute, function (req, res, next) {
    logger.debug('req.query: %s', JSON.stringify(req.query, null, 4));
    User.syncTransaction(req.query, function (err) {
      if (err) logger.warn(err);
      if (parseInt(req.query.confirmations, 10)>=config.blockchainConfirmationLimit)
        res.send("*ok*");
      else
        res.sendStatus(200);
    });
  });

  router.get("/address", mixins.loggedIn, function (req, res, next) {
    User.generateAddress(req.session.user, function (err) {
      if (err) {
        logger.warn(err);
        return res.sendStatus(404);
      }
      res.sendStatus(200);
    });
  });

  // check for recent tips
  router.post("/sync", function (req, res, next) {
    if (!req.session.user) return res.sendStatus(204);
    // logger.debug('req.session.user: %s', JSON.stringify(req.session.user, null, 4));
    req.body._id = req.session.user._id ? req.session.user._id : null;
    User.sync(req.body, function (err, synced) {
      if (err) {
        logger.warn(err);
        return res.sendStatus(404);
      }
      res.status(200).send(synced);
    });
  });

  // router.get("/add", mixins.loggedIn,  function (req, res, next) {
  //   User.findOne({'ip':req.session.user.ip}, function (err, user) {
  //     if (err) logger.warn(err);
  //     if (!user) return res.sendStatus(404);
  //     // user.time_added = 60;
  //     var oneDollarInBTC = 0.00015;
  //     user.addTime(100000000*oneDollarInBTC*6);
  //   });
  // });

  router.get("/key", mixins.loggedIn, mixins.loggedInAlexD, function (req, res, next) {
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