// Config file
var config = {};

config.botName = "DeezNuts";

// Deploy Environment
require('./deploy').call(config);

// App Settings
process.title = 'deeznuts';
config.port = Number(process.env.PORT || 3000);
config.Crons_On = true;

// Site Settings
config.title = "Alex D.'s Nuts";
config.siteTitle = "AlexDeezNuts.com";
config.author = "Skeetzo";
config.description = "Porn Star Streamer";
config.Google_Analytics = "UA-82463743-8";
config.pages = ['privacy','terms','support','2257-compliance','callback'];
config.ssl_key = '/etc/letsencrypt/live/alexdeeznuts-0001.com/privkey.pem';
config.ssl_cert = '/etc/letsencrypt/live/alexdeeznuts-0001.com/fullchain.pem';

config.domain = "alexdeeznuts.com";
if (config.local) config.domain = "localhost";
var live_url = "wss://"+config.domain+":8443/live/stream.flv?sign=";
// var live_url = "https://"+config.domain+":8443/live/stream/index.mpd";
// var live_url = "https://"+config.domain+":8443/live/stream.flv?sign=";
// if (config.debugging&&!config.ssl) live_url = "http://"+config.domain+":8000/live/stream/index.mpd";
if (config.debugging&&!config.ssl) live_url = "http://"+config.domain+":8000/live/stream.flv?sign=";
// if (config.debugging&&!config.ssl) live_url = "ws://"+config.domain+":8000/live/stream.flv?sign=";
if (config.ssl) config.domain = "https://"+config.domain;
else config.domain = "http://"+config.domain;

// DeezNuts Settings
config.archive_videos = true;
config.archive_delay = 10000;
config.conversionRate = 6; // $1 per 6 minutes
config.createPreviews = true;
config.defaultPrice = 5; // in dollars
config.defaultTime = 60; // time in seconds
config.defaultPreviewDuration = 30;
config.rtmpTimeout = 1000 * 30;
if (config.debugging) config.rtmpTimeout = 0;
config.live_occupancy = 10;
config.syncInterval = 1; // in seconds
if (config.debugging) {
	config.defaultTime = 60*60*23+45*60;
	config.syncInterval = config.syncInterval*3;
}
config.status = "Not Live";
// Bitcoin & Blockchain
config.bitcoin_address = "7h15157o74lly4b17co1n4ddre55";
config.bitcoin_qr = "http://placehold.it/150x150";
config.bitcoin_link = "bitcoin:"+config.bitcoin_address;
config.blockchainRoute = "/btc";
config.blockchainCallback = config.domain+config.blockchainRoute;
config.blockchainConfirmationLimit = 6;
config.blockchainGapLimit = 20;
config.blockchainCheckGap = true;
// PayPal
config.paypal_ips = ["64.4.248", "64.4.249", "66.211.168", "66.211.168", "173.0.84", "173.0.84", "173.0.88", "173.0.88", "173.0.92", "173.0.93", "173.0.82", "173.0.81"];

// RTMP Stream
config.streamKeyExpire = 3600000;
config.streamRecording = true;
// config.streamRecording_mp4 = true;
// config.streamRecording_dash = true;
// config.streamRecording_hls = true;

// Email
config.emailing = true;
config.emailing_testing = false;
config.emailing_on_new = true;
config.emailing_on_error = true;
config.emailing_on_buy = true;
config.emailing_on_transaction = true;

// Twitter
config.Twitter_link = config.domain+'/live';

config.siteData = 
	{ 	
		debugging: config.debugging,
		title: config.title,
		siteTitle: config.siteTitle,
		domain: config.domain,
		author: config.author,
		description: config.description,
		Google_Analytics: config.Google_Analytics,
		status: config.status,
		live_url: live_url,
		syncInterval: config.syncInterval
	};

config.defaultVideo = {
	'title': 'Example',
	'performers': ['Myself','Your Mom'],
	'isOriginal': true,
	'duration': 247,
	'path': require('path').join(config.videosPath, 'preview.mp4'),
	'backedUp': true
};

require('./keys').call(config);
require('./logger').call(config);
require('./emails').call(config);
require('./crons').call(config);

module.exports = config;