var express = require('express'),
    router = express.Router(),
    config = require('../config/index'),
    logger = config.logger,
    async = require('async'),
    _ = require('underscore'),
    mixins = require('../modules/mixins'),
    Viewer = require('../models/viewer');

// Iamthequeenoffrance666

// /
router.use(mixins.resetLocals, function (req, res, next) {
	var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  logger.log("%s: /%s %s",ip, req.method, req.url);
	next(null);
});

// /index
router.get("/", mixins.findViewer, function (req, res, next) {
  res.render('index', req.session.locals);
});

// /live
router.get("/live", mixins.findViewer, mixins.hasPaid, function (req, res, next) {
  if (config.streamKeyCurrent)
    req.session.locals.key = config.streamKeyCurrent;
  res.render('live', req.session.locals);    
});

// blockchainCallback
router.get(config.blockchainRoute, function (req, res, next) {
  // find viewer by bitcoin:address and query:secret
  // add time to viewerreason
  // 
  // logger.log('req: %s', JSON.stringify(req, null, 4));
  logger.log('req.body: %s', req.body);
  logger.log('req.body: %s', JSON.stringify(req.body, null, 4));
  Viewer.findOne({'address':req.body.address,'secret':req.body.secret}, function (err, viewer) {
    if (err) logger.warn(err);
    if (!viewer) {
      logger.warn('No matching viewer: %s', JSON.stringify(req.body, null, 4));
      return res.sendStatus(200);
    }
    viewer.addTime(req.body.value);
    // viewer.addTransaction({'value':req.body.value,'secret':req.body.secret,'address':req.body.address,'hash':req.body.transaction_hash,'confirmations':req.body.confirmations});
    req.session.locals.viewer = mixins.Viewer(viewer);
    // signal them somehow that time was added?
    res.sendStatus(200);
  });
});

// check for recent tips
router.post("/sync", mixins.findViewer, function (req, res, next) {
  Viewer.findOne({'ip':req.session.viewer.ip}, function (err, viewer) {
    if (err) logger.warn(err);
    if (!viewer) return res.sendStatus(404);
    if (Math.abs(parseInt(viewer.time)-parseInt(req.body.time))>5)
      logger.log('not syncing time: %s seconds -> %s seconds', viewer.time, req.body.time);
    else {
      logger.log('syncing time: %s seconds -> %s seconds', viewer.time, req.body.time);
      viewer.time = req.body.time;
    }
    var added = viewer.time_added || false;
    viewer.time_added = false;
    viewer.save(function (err) {
      if (err) logger.warn(err);
      res.status(200).send({'time':viewer.time,'added':added,'status':config.status});
    });
  });
});

router.get("/add", mixins.findViewer,  function (req, res, next) {
  Viewer.findOne({'ip':req.session.viewer.ip}, function (err, viewer) {
    if (err) logger.warn(err);
    if (!viewer) return res.sendStatus(404);
    // viewer.time_added = 60;
    var oneDollarInBTC = 0.00015;
    viewer.addTime(100000000*oneDollarInBTC*6);
  });
});

module.exports = router;