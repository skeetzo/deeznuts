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

var tweetLive = function(tw, callback) {
	logger.log('Tweeting Live');
	var tweet = "I\'ve just gone live! "+moment(new Date()).format('D/MM @ H:MM')+" "+config.Twitter_link;
    if (!tw) tw = tweet;
    else tw += " "+config.Twitter_link
    logger.debug('tweet: %s', tweet);
	if (!config.Twitter) return callback('Twitter Disabled');
	if (!config.Twitter_tweeting) return callback('Not Tweeting');
	var T = new Twit(config.TwitterConfig);
    T.post('statuses/update', { 'status': tweet }, function(err) { 
    	if (err) return callback(err);
        logger.log('Live Tweet posted');
        callback(null);
    });
}
module.exports.tweetLive = tweetLive;


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












