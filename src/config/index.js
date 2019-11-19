// Config file
var config = {};
var path = require('path');

// Debugging
if (!process.env.NODE_ENV) process.env.NODE_ENV = "development";
deploy(process.env.NODE_ENV);

config.Crons_On = true;

// App Settings
config.botName = "DeezNuts";
config.port = Number(process.env.PORT || 3000);

// Site Settings
config.title = "Alex D.'s Nuts";
config.siteTitle = "AlexDeezNuts.com";
config.author = "Skeetzo";
config.description = "Porn Star Streamer";
config.Google_Analytics = "UA-82463743-8";
config.pages = ['privacy','terms','support','2257-compliance','callback'];
config.ssl_key = '/etc/letsencrypt/live/alexdeeznuts.com-0001/privkey.pem';
config.ssl_cert = '/etc/letsencrypt/live/alexdeeznuts.com-0001/fullchain.pem';

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

config.backup_db = true;
config.backup_app = false;

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

	config.live_enabled = false;

	config.backup_db = false;
	config.backupToOnlyFans = false;
	config.archive_on_publish = false;
	config.delete_on_publish = false;
	config.deleteMissing = false;

	config.backup_on_archive = false;
	config.upload_on_archive = false;

	config.PayPal = false;
	config.PayPal_environment = 'sandbox';
	config.PayPal_syncing_webhooks = false;

	config.Twitter = false;
	config.Twitter_tweeting = false;
	config.Twitter_deleting_tweet = true;
	config.Twitter_deleting_tweet_on_live = true;
	config.Twitter_tweet_on_publish = false;
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

	config.debugging_paypal = false;
	config.debugging_paypal_reset_plans = false;
	config.debugging_clean_fileNames = false;
	config.go_live = false;
	config.repair_moov = false;

	config.upload_all_on_boot = false;
	config.upload_to_OnlyFans = false;

	config.populateFromFiles = false;
	config.concat_on_publish = false;

	if (environment=='development') {
		config.debugging = true;
		config.debugging_live = true;
		// config.debugging_address = true;
		// config.debugging_sync = true;
		// config.debugging_reset_db = true;
		// config.debugging_reset_files = true;
		// config.debugging_reset_logs = true;
		// config.debugging_blockchain = true;
		config.local = true;
		// config.remoteDatabase = true;
		// config.delete_on_publish = true;
		config.archive_on_publish = true;
		// config.go_live = true;
		// config.backup_on_archive = true;
		// config.debugging_crons = true;
		// config.debugging_paypal = true;
		// config.debugging_paypal_reset_plans = true;
		// config.populateFromFiles = true;	
		config.upload_all_on_boot = true;
		config.upload_to_OnlyFans = true;
	}
	else if (environment=='staging') {
		config.debugging = true;
		// config.debugging_blockchain = true;
		config.debugging_live = true;
		// config.debugging_reset_db = true;
		// config.debugging_reset_files = true;
		// config.debugging_address = true;
		// config.debugging_sync = true;
		config.ssl = true;
		config.PayPal = true;
		config.PayPal_environment = 'sandbox';
		config.Twitter = true;
		// config.remoteDatabase = true;
		// config.archive_on_publish = true;
		// config.backup_on_archive = true;
		config.delete_on_publish = true;
		// config.deleteMissing = true;
		// config.debugging_crons = true;
		// config.debugging_clean_fileNames = true;
	}
	else if (environment=='production') {
		config.ssl = true;
		config.PayPal = true;
		config.PayPal_environment = 'live';
		config.PayPal_syncing_webhooks = false;
		// config.Twitter = true;
		// config.Twitter_tweeting = true;
		config.archive_on_publish = true;
		// config.delete_on_publish = true;
		// config.remoteDatabase = true;
		// config.populateFromFiles = true;
		// config.go_live = true;
		// config.backup_db = true;
		config.upload_all_on_boot = true;
		config.deleteMissing = true;
		config.backup_on_archive = true;
		config.upload_on_archive = true;
		config.upload_to_OnlyFans = true;
		// config.concat_on_publish = true;
	}
}

// Mount Paths
var mountName = config.botName.toLowerCase();
config.mnt_path = '/opt/apps/'+mountName;
// if (process.env.NODE_ENV!="development")
	// config.mnt_path = '/mnt/'+mountName;	
	// config.mnt_path = '/mnt/apps/'+mountName;	
config.local_keys_path = path.join(config.mnt_path, 'dev/localConfig.json');
config.local_google_keys_path = path.join(config.mnt_path, 'dev/google.json');
// config.logs_dir = path.join(config.mnt_path, 'logs');
config.logs_dir = path.join('/var/log/apps', mountName);
config.logs_file = path.join(config.logs_dir, 'file.log');
config.videosPath = path.join(config.mnt_path, 'videos');
config.imagesPath = path.join(config.mnt_path, 'images');
config.watermarkPath = path.join(config.imagesPath, "watermark.png");
config.workingVideoPath = path.join(config.videosPath, "working.mp4");

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
