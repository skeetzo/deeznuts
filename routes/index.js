var express = require('express'),
    router = express.Router(),
    config = require('../config/index'),
    logger = config.logger,
    async = require('async'),
    _ = require('underscore'),
    mixins = require('../modules/mixins');

// var Receive = require('blockchain.info/Receive')
// var xpub = '',
//  callback = config.blockchainCallback,
//  key = config.blockchainKey,
//  options = {};
// var myReceive = new Receive(xpub, callback, key, options);
// var checkgap = myReceive.checkgap().gap;
// myReceive = myReceive.generate({'secret':'balls'});
// var generate = myReceive.address;
// var address = myReceive.address;

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

module.exports = router;