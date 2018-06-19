var express = require('express'),
    router = express.Router(),
    config = require('../config/index'),
    logger = config.logger,
    async = require('async'),
    _ = require('underscore'),
    mixins = require('../modules/mixins'),
    Viewer = require('../models/viewer');

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
  logger.debug('req.query: %s', JSON.stringify(req.query, null, 4));
  Viewer.addTransaction(req.query, function (err) {
    if (err) logger.warn(err);
    res.send("*ok*");
  });
});

// check for recent tips
router.post("/sync", mixins.findViewer, function (req, res, next) {
  req.body.ip = req.session.viewer.ip;
  Viewer.sync(req.body, function (err, synced) {
    if (err) {
      logger.warn(err);
      res.sendStatus(404);
    }
    res.status(200).send(synced);
  });
});

// router.get("/add", mixins.findViewer,  function (req, res, next) {
//   Viewer.findOne({'ip':req.session.viewer.ip}, function (err, viewer) {
//     if (err) logger.warn(err);
//     if (!viewer) return res.sendStatus(404);
//     // viewer.time_added = 60;
//     var oneDollarInBTC = 0.00015;
//     viewer.addTime(100000000*oneDollarInBTC*6);
//   });
// });

router.get("/key", function (req, res, next) {
  res.render('key', req.session.locals);
});

router.post("/key", function (req, res, next) {
  var phrase = req.body.phrase;
  if (phrase!='banana') return res.sendStatus(401);
  var timestamp =(Date.now() + 3600000);
  var hash = require('md5')("/live/stream-"+timestamp+"-"+config.streamKey);
  res.status(200).send({'key':timestamp+"-"+hash});
});

module.exports = router;