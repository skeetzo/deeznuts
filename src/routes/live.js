var config = require('../config/index'),
    logger = config.logger,
    mixins = require('../modules/mixins');

module.exports = function homeRoutes(router) {

  // Live
  router.get("/live", mixins.loggedIn, mixins.hasPaid, mixins.hasRoom, function (req, res, next) {
    res.render('live', req.session.locals);    
  });

  router.post("/live", mixins.loggedIn, mixins.loggedInAlexD, function (req, res, next) {
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

}