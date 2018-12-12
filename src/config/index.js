// Config file
var config = {};
var path = require('path');

// Debugging
if (!process.env.NODE_ENV) process.env.NODE_ENV = "development";
deploy(process.env.NODE_ENV);

config.Crons_On = true;

// App Settings
config.botName = "DeezNuts";
config.siteName = "DeezNuts";
config.port = Number(process.env.PORT || 3000);

// Site Settings
config.title = "Alex D.'s Nuts";
config.siteTitle = "AlexDeezNuts.com";
config.author = "Skeetzo";
config.description = "Porn Star Streamer";
config.Google_Analytics = "UA-82463743-8";
config.pages = ['privacy','terms','support','2257-compliance'];
config.ssl_key = '/etc/letsencrypt/live/alexdeeznuts.com-0001/privkey.pem';
config.ssl_cert = '/etc/letsencrypt/live/alexdeeznuts.com-0001/fullchain.pem';

config.domain = "alexdeeznuts.com";
if (config.local) config.domain = "localhost";
var live_url = "wss://"+config.domain+":8443/live/stream.flv?sign=";
// var live_url = "https://"+config.domain+":8443/live/stream/index.mpd";
// var live_url = "https://"+config.domain+":8443/live/stream.flv?sign=";
// if (config.debugging&&!config.ssl) live_url = "http://"+config.domain+":8000/live/stream/index.mpd";
// if (config.debugging&&!config.ssl) live_url = "http://"+config.domain+":8000/live/stream.flv?sign=";
if (config.debugging&&!config.ssl) live_url = "ws://"+config.domain+":8000/live/stream.flv?sign=";
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

config.rebuildFromFiles = false;

config.syncInterval = 3; // in seconds
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
config.emailing_on_transaction = true;
config.domainEmail = 'deeznuts.com';

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

function deploy(environment) {
	config.debugging = false;
	config.ssl = false;
	config.local = false;

	config.backupToOnlyFans = false;
	config.archive_on_publish = false;
	config.deleteMissing = false;

	config.Twitter = false;
	config.Twitter_tweeting = false;
	config.Twitter_tweeting_on_live = false;
	config.remoteDatabase = false;

	config.debugging_blockchain = false;
	config.debugging_live = false;
	config.debugging_address = false;
	config.debugging_sync = false;

	config.debugging_reset_db = false;
	config.debugging_reset_files = false;
	config.debugging_reset_logs = false;
	config.debugging_backup_db = false;

	config.debugging_crons = false;

	if (environment=='development') {
		config.debugging = true;
		config.debugging_live = true;
		config.debugging_address = true;
		config.debugging_sync = true;
		config.debugging_reset_db = true;
		config.debugging_reset_files = true;
		config.debugging_reset_logs = true;
		config.debugging_blockchain = true;
		config.local = true;
		config.remoteDatabase = true;
		config.archive_on_publish = true;
		config.debugging_crons = true;
	}
	else if (environment=='staging') {
		config.debugging = true;
		config.debugging_blockchain = true;
		// config.debugging_live = true;
		// config.debugging_reset_db = true;
		// config.debugging_reset_files = true;
		// config.debugging_address = true;
		// config.debugging_sync = true;
		config.ssl = true;
		config.Twitter = true;
		config.Twitter_tweeting = true;
		config.Twitter_tweeting_on_live = true;
		config.remoteDatabase = true;
		config.archive_on_publish = true;
		config.backupToOnlyFans = true;
		// config.deleteMissing = true;
		// config.debugging_crons = true;
	}
	else if (environment=='production') {
		config.ssl = true;
		config.Twitter = true;
		config.Twitter_tweeting = true;
		config.Twitter_tweeting_on_live = true;
		config.backupToOnlyFans = true;
		config.archive_on_publish = true;
	}
}

config.dev_path = '/mnt/deeznuts/dev';
config.local_keys_path = path.join(config.dev_path, 'localConfig.json');
config.local_google_keys_path = path.join(config.dev_path, 'google.json');
config.logs_dir = path.join(config.dev_path, 'logs');
config.logs_file = path.join(config.dev_path, 'logs/file.log');

config.videosPath = '/mnt/deeznuts/videos';
config.imagesPath = '/mnt/deeznuts/images';
config.watermarkPath = path.join(config.imagesPath, "watermark.png");

config.defaultVideo = {
	'title': 'Example',
	'performers': ['Myself','Your Mom'],
	'isOriginal': true,
	'duration': 247,
	'path': path.join(config.videosPath, 'preview.mp4'),
	'backedUp': true
};

require('./keys').call(config);
require('./logger').call(config);
require('./emails').call(config);
require('./crons').call(config);

module.exports = config;