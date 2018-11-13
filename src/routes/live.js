var config = require('../config/index'),
    logger = config.logger,
    mixins = require('../modules/mixins'),
    User = require('../models/user');

module.exports = function homeRoutes(router) {

  // /live
  router.get("/live", mixins.loggedIn, mixins.hasPaid, mixins.hasRoom, function (req, res, next) {
    res.render('live', req.session.locals);    
  });

  router.post("/live", mixins.loggedIn, mixins.loggedInAlexD, function (req, res, next) {
    console.log(JSON.stringify(req.body));
    console.log(JSON.stringify(req.params));
    if (req.body.live=="true") {
      logger.log('Updating Status %s -> %s', config.status, 'Live');
      config.status = 'Live';   
      res.status(200).send();
    }
    else if (req.body.live=="false") {
      logger.log('Updating Status %s -> %s', config.status, 'Not Live');
      config.status = 'Not Live';
      res.status(400).send();
    }
    else
      res.status(400).send();
  });

  // live
  router.get("/address-live", mixins.loggedIn, function (req, res, next) {
    User.generateAddress({'_id':req.session.user._id,'reason':'live'}, function (err) {
      if (err) {
        logger.warn(err);
        return res.sendStatus(400);
      }
      res.status(200).send();
    });
  });

  // router.get("/on_play", function (req, res, next) {
  //   logger.log('--- Stream Playing ---');
  //   config.status = 'Live';
  //   res.status(200).send();
  // });

  // router.get("/on_done", function (req, res, next) {
  //   logger.log('--- Stream Done ---');
  //   config.status = 'Not Live';
  //   res.status(200).send();
  // });

  // router.get("/on_connect", function (req, res, next) {
  //   logger.log('--- Stream Connected ---');
  //   config.status = 'Not Live';
  //   res.status(200).send();
  // });
}