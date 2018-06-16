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
  // add time to viewerreason
  // 
  logger.log('req: %s', JSON.stringify(req, null, 4));
  logger.log('req.body: %s', req.body);
  logger.log('req.body: %s', JSON.stringify(req.body));
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

// check for recent tips
router.get("/tips", function (req, res, next) {
  Viewer.findOne({'ip':req.session.viewer.ip,'time_added':{'$ne':''}}, function (err, viewer) {
    if (err) logger.warn(err);
    if (!viewer) return res.sendStatus(404);
    var time = viewer.time_added;
    viewer.time_added = '';
    viewer.save(function (err) {
      if (err) logger.warn(err);
      res.status(200).send({'time':time});
    });
  });
});

router.get("/key", function (req, res, next) {
  res.render('key', req.session.locals);
});

router.post("/key", function (req, res, next) {
  var phrase = req.body.phrase;
  if (phrase!='banana') return res.sendStatus(401);
  var hash = md5("/live/stream-"+(Date.now() + 3600000)+"-"+config.streamKey);
  res.status(200).send({'key':hash});
});



// rtmp://hostname:port/appname/stream?sign=expires-HashValue
// 3.expiration time: 2017/8/23 11:25:21 ,The calculated expiration timestamp is
//     1503458721
// 4.The combination HashValue is:
//     HashValue = md5("/live/stream-1503458721-nodemedia2017privatekey”)
//     HashValue = 80c1d1ad2e0c2ab63eebb50eed64201a

// rtmp://192.168.0.10/live/stream?sign=1503458721-80c1d1ad2e0c2ab63eebb50eed64201a



module.exports = router;