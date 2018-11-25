var config = require('../config/index'),
    logger = config.logger,
    moment = require('moment'),
    Twit = require('twit');

var T;

/*
	connects to Twitter's processes
*/
var connect = function(callback) {
	var self = this;
	logger.log('Connecting to Twitter...');
	if (!config.Twitter) return callback('Twitter is Disabled');
	T = new Twit(config.TwitterConfig);
	T.get('account/verify_credentials',{}, function (err, user) { 
        if (err) return callback(err);
        logger.log('Connected to Twitter: %s', user.name);
        if (config.Twitter_tweeting)
        	logger.log('Tweeting Enabled');
        else
        	logger.log('Tweeting Disabled');
    });
}
module.exports.connect = connect;

var tweetLive = function(tw) {
    var self = this;
	logger.log('Tweeting Live');
	var tweet = "I\'ve just gone live! "+moment(new Date()).format('MM-dd')+" "+config.Twitter_link
    logger.debug('tweet: %s', tweet);
	if (!config.Twitter) return logger.debug('Twitter Disabled');
	if (!config.Twitter_tweeting) return logger.debug('Not Tweeting');
	T.post('statuses/update', { 'status': tweet }, function(err) { 
    	if (err) return logger.warn(err);
        logger.log('Live Tweet posted');
    });
}
module.exports.tweetLive = tweetLive;