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

  // live
  router.get("/address-live", mixins.loggedIn, function (req, res, next) {
    User.generateAddress({'_id':req.session.user._id,'reason':'live'}, function (err) {
      if (err) {
        logger.warn(err);
        return res.sendStatus(404);
      }
      res.sendStatus(200);
    });
  });

  router.post("/on_play", function (req, res, next) {
    logger.log('--- Stream Playing ---');
    config.status = 'Live';
    res.sendStatus(200);
  });

  router.post("/on_done", function (req, res, next) {
    logger.log('--- Stream Done ---');
    config.status = 'Not Live';
    res.sendStatus(200);
  });

  router.post("/on_connect", function (req, res, next) {
    logger.log('--- Stream Connected ---');
    config.status = 'Not Live';
    res.sendStatus(200);
  });
}