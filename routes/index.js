var express = require('express'),
    router = express.Router(),
    config = require('../config/index'),
    logger = config.logger,
    async = require('async'),
    _ = require('underscore'),
    mixins = require('../modules/mixins');

// Iamthequeenoffrance666

// /
router.use(mixins.resetLocals, mixins.findViewer, function (req, res, next) {
	var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  logger.log("%s: /%s %s",ip, req.method, req.url);
	next(null);
});

// /index
router.get("/", function (req, res, next) {
  res.render('index', req.session.locals);
});

// /live
router.get("/live", mixins.hasPaid, function (req, res, next) {
  res.render('live', req.session.locals);    
});

// blockchainCallback
router.post("/"+config.blockchainCallback, function (req, res, next) {
  // find viewer by bitcoin:address and query:secret
  // add time to viewer
  // 
  logger.log('req.body: %s', req.body);
  Viewer.findOne({'address':req.body.address,'secret':req.body.secret}, function (err, viewer) {
    if (err) logger.warn(err);
    if (!viewer) {
      logger.warn('No matching viewer: %s', JSON.stringify(req.body, null, 4));
      return res.sendStatus(200);
    }
    viewer.addTime(req.body.value);
    req.session.locals.viewer = mixins.Viewer(viewer);
    // signal them somehow that time was added?
    res.sendStatus(200);
  });
});


module.exports = router;