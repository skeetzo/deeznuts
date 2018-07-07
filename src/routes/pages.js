var config = require('../config/index'),
    logger = config.logger,
    _ = require('underscore'),
    mixins = require('../modules/mixins');

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
}