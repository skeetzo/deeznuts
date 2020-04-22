var config = require('../config/index'),
    logger = config.logger,
    mixins = require('../modules/mixins');

module.exports = function homeRoutes(router) {

  // Live
  router.get("/live", mixins.loggedIn, mixins.syncUser, mixins.hasPaid, mixins.hasRoom, function (req, res, next) {
    res.render('live', req.session.locals);    
  });

  router.post("/live", mixins.loggedIn, mixins.loggedInDeezNuts, function (req, res, next) {
    if (req.body.live=="true"&&config.live_enabled) {
      logger.log('Updating Status %s -> %s', config.live_status, 'Live');
      config.live_status = 'Live';   
      res.status(200).send();
    }
    else if (req.body.live=="false") {
      logger.log('Updating Status %s -> %s', config.live_status, 'Not Live');
      config.live_status = 'Not Live';
      res.status(400).send();
    }
    else
      res.status(400).send();
  });

}