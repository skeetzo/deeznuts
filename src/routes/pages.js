var config = require('../config/index'),
    logger = config.logger,
    _ = require('underscore'),
    mixins = require('../modules/mixins'),
    User = require('../models/user');

module.exports = function homeRoutes(router) {

  // /
  router.use(mixins.resetLocals, mixins.syncUser, function (req, res, next) {
  	var ips = req.ips || [];
    ips.push(req.connection.remoteAddress);
    if (req.headers['x-forwarded-for'])
      ips.push(req.headers['x-forwarded-for']);
    logger.log("%s /%s %s", ips, req.method, req.url);
    // misc pages redirect
    if (_.contains(config.pages, req.url.replace('/','')))
      return res.render(req.url.replace('/',''), req.session.locals);
  	next(null);
  });

  // /index
  router.get("/", function (req, res, next) {
    res.render('index', req.session.locals);
  });

  // blockchainCallback
  //- /tip
  router.get(config.blockchainRoute, function (req, res, next) {
    logger.debug('req.query: %s', JSON.stringify(req.query, null, 4));
    require('../models/transaction').sync(req.query, function (err) {
      if (err) logger.warn(err);
      if (parseInt(req.query.confirmations, 10)>=config.blockchainConfirmationLimit)
        res.send("*ok*");
      else
        res.status(200).send();
    });
  });

  router.get("/add", mixins.loggedIn,  function (req, res, next) {
    User.findOne({'ip':req.session.user.ip}, function (err, user) {
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