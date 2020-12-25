// Config file
var config = {};
config.botName = "DeezNuts";

// Deploy Environment
require('./deploy').call(config);

// App Settings
process.title = 'deeznuts';
config.port = Number(process.env.PORT || 3000);

// Site Settings
config.title = "Alex D.'s Nuts";
config.siteTitle = "AlexDeezNuts.com";
config.author = "Skeetzo";
config.description = "Pron Star";
config.Google_Analytics = "UA-82463743-8";
config.pages = ['privacy','terms','support','2257-compliance','callback', 'key'];
config.domain = "alexdeeznuts.com";
config.ssl_key = `/etc/letsencrypt/live/${config.domain}/privkey.pem`;
config.ssl_cert = `/etc/letsencrypt/live/${config.domain}/fullchain.pem`;

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
config.conversionRate = (6*60); // 6 minutes per dollar
config.defaultPrice = 5; // in dollars
config.defaultTime = 60; // time in seconds
config.defaultPreviewDuration = 30;
config.rtmpTimeout = 1000 * 30;
if (config.debugging) config.rtmpTimeout = 0;
config.live_occupancy = 50;
config.syncInterval = 1; // in seconds
if (config.debugging) {
	config.defaultTime = 60*60*23+45*60;
	config.syncInterval = config.syncInterval*3;
}
config.live_status = "Not Live";

// Bitcoin & Blockchain
config.bitcoin_address = "7h15157o74lly4b17co1n4ddre55";
config.bitcoin_qr = "http://placehold.it/150x150";
config.bitcoin_link = "bitcoin:"+config.bitcoin_address;
config.blockchainRoute = "/btc";
config.blockchainCallback = config.domain+config.blockchainRoute;
config.blockchainConfirmationLimit = 6;
config.blockchainGapLimit = 20;
config.blockchainCheckGap = true;

// RTMP Stream
config.streamKeyExpire = 3600000;
config.streamRecording = true;
// config.streamRecording_mp4 = true;
// config.streamRecording_dash = true;
// config.streamRecording_hls = true;

// Email
config.emailing = true;
config.emailing_on_new = true;
config.emailing_on_error = true;
config.emailing_on_buy = true;

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
		status: config.live_status,
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
require('./bcoin').call(config);

module.exports = config;