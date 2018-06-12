var express = require('express'),
    router = express.Router(),
    config = require('../config/index'),
    logger = config.logger,
    async = require('async'),
    _ = require('underscore'),
    mixins = require('../modules/mixins');

router.use(mixins.resetLocals, function (req, res, next) {
	// logger.debug(req);
	var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    logger.log("%s: /%s %s",ip, req.method, req.url);
	next(null);
});

// var Receive = require('blockchain.info/Receive')
// var xpub = '',
// 	callback = config.blockchainCallback,
// 	key = config.blockchainKey,
// 	options = {};
// var myReceive = new Receive(xpub, callback, key, options);

// Index
router.get("/", function (req, res, next) {
  res.render('index', req.session.locals);
});

router.get("/live", mixins.hasPaid, function (req, res, next) {
  res.render('live', req.session.locals);    
});

module.exports = router;