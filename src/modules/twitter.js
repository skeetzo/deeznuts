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

var tweetOnArchiveLock = false;
var tweetOnArchive = function(video, callback) {
    if (tweetOnArchiveLock) return callback('Recently Tweeted');
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
        tweetOnArchiveLock = true;
        setTimeout(function archiveTimeout() {
            tweetOnArchiveLock = false;
            logger.debug('tweetOnArchiveLock released');
        }, 10000);
    });
}
module.exports.tweetOnArchive = tweetOnArchive;

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
            // logger.log('status: %s', JSON.stringify(tweets[i], null, 4));
            if (~tweets[i].text.indexOf("/t.co/"))
                return T.post('statuses/destroy/:id', { 'id': tweets[i].id_str }, function (err, data, response) {
                    if (err) return callback(err);
                    logger.log('Live Tweet destroyed: %s', tweets[i].id_str);
                    callback(null);
                });       
        }
        callback('Error: No Live Tweet Found');
    });
}
module.exports.deleteLiveTweet = deleteLiveTweet;



