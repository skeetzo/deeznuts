var config = require('../config/index'),
    logger = config.logger,
    moment = require('moment'),
    Twit = require('twit');

/*
	connects to Twitter's processes
*/
var connect = function(callback) {
	logger.log('Connecting to Twitter...');
	if (!config.Twitter) return callback('Twitter is Disabled');
	var T = new Twit(config.TwitterConfig);
	T.get('account/verify_credentials',{}, function (err, user) { 
        if (err) return callback(err);
        logger.log('Connected to Twitter: %s', user.name);
        if (config.Twitter_tweeting)
        	logger.log('Tweeting Enabled');
        else
        	logger.log('Tweeting Disabled');
        callback(null);
    });
}
module.exports.connect = connect;

var tweet = function(tw, callback) {
	logger.log('Tweeting');
    if (!tw) tw = "I\'ve just gone live! "+moment(new Date()).format('D/MM @ H:MM')+" "+config.Twitter_link;
    else tw += " "+config.Twitter_link
    logger.debug('tweet: %s', tw);
	if (!config.Twitter) return callback('Twitter Disabled');
	if (!config.Twitter_tweeting) return callback('Not Tweeting');
	var T = new Twit(config.TwitterConfig);
    T.post('statuses/update', { 'status': tw }, function(err) { 
    	if (err) return callback(err);
        logger.log('Live Tweet posted');
        callback(null);
    });
}
module.exports.tweet = tweet;

var tweetOnPublishLock = false;
var tweetOnPublish = function(video, callback) {
    if (tweetOnPublishLock) return callback('Recently Tweeted');
    logger.log('Tweeting Published Video: ', video.title);
    var tw = "I\'ve just uploaded another video! "+video.link;
    logger.debug('tweet: %s', tw);
    if (!config.Twitter) return callback('Twitter Disabled');
    if (!config.Twitter_tweeting) return callback('Not Tweeting');
    var T = new Twit(config.TwitterConfig);
    T.post('statuses/update', { 'status': tw }, function(err) { 
        if (err) return callback(err);
        logger.log('Published Tweet posted');
        callback(null);
        tweetOnPublishLock = true;
        setTimeout(function publishTimeout() {
            tweetOnPublishLock = false;
            logger.debug('tweetOnPublishLock released');
        }, 10000);
    });
}
module.exports.tweetOnPublish = tweetOnPublish;


var deleteLiveTweet = function(callback) {
    logger.log('Deleting Live Tweet');
    if (!config.Twitter) return logger.debug('Twitter Disabled');
    if (!config.Twitter_deleting_tweet) return logger.debug('Not Deleting Tweet');
    // T.get('statuses/user_timeline', { 'user_id': Twitter_user.user_id, 'screen_name': Twitter_user.screen_name, 'count': 20, 'since_id': lastTweet }, function (err, tweets) {
    var T = new Twit(config.TwitterConfig);
    T.get('statuses/user_timeline', { 'count': 20 }, function (err, tweets) {
        if (err) return callback(err);
        if (tweets.length<=0) return cTallback('Error: No Tweets Found');
        for (var i=0;i<tweets.length;i++) {
            logger.log('status: %s', tweets[i]);
            if (~tweets[i].status.indexOf(config.Twitter_link))
                return T.post('statuses/destroy/:id', { 'id': tweets[i].id }, function (err, data, response) {
                    if (err) return callback(err);
                    logger.log('Live Tweet destroyed: %s', tweets[i].id);
                    callback(null);
                });       
        }
        callback('Error: No Live Tweet Found');
    });
}
module.exports.deleteLiveTweet = deleteLiveTweet;












