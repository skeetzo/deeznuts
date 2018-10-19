// Config file
var config = {};

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
config.domain = "alexdeeznuts.com";
if (config.local) config.domain = "localhost";
if (config.ssl) config.domain = "https://"+config.domain;
else config.domain = "http://"+config.domain;
config.author = "Skeetzo";
config.description = "Porn Star Streamer";
config.Google_Analytics = "UA-82463743-8";
config.pages = ['privacy','terms','support'];
config.ssl_key = '/etc/letsencrypt/live/alexdeeznuts.com-0001/privkey.pem';
config.ssl_cert = '/etc/letsencrypt/live/alexdeeznuts.com-0001/fullchain.pem';

// DeezNuts Settings
config.conversionRate = 6; // $1 per 6 minutes
config.createPreviews = false;
config.defaultPrice = 5; // in dollars
config.defaultTime = 60; // time in seconds
config.syncInterval = 3000;
if (config.debugging) {
	config.defaultTime = 60*60*23+45*60;
	config.syncInterval = config.syncInterval*3;
}
config.status = "Not Live";
// Bitcoin & Blockchain
config.bitcoin_address = "7h15157o74lly4b17co1n4ddre55";
config.bitcoin_qr = "http://placehold.it/150x150";
config.bitcoin_link = "bitcoin:"+config.bitcoin_address;
config.blockchainRoute = "/tip";
config.blockchainCallback = config.domain+config.blockchainRoute;
config.blockchainConfirmationLimit = 6;
config.blockchainGapLimit = 20;
config.blockchainSecret = "gofuckyourself6969";
// RTMP Stream
config.streamKey = "yourmotherisadirtywhore";
config.streamKeyExpire = 3600000;
config.streamRecording = true;
// config.streamRecording_mp4 = true;
// config.streamRecording_dash = true;
// config.streamRecording_hls = true;

var live_url = config.domain+":8443/live/stream.flv?sign=";
if (config.debugging&&!config.ssl) live_url = config.domain+":8000/live/stream.flv?sign=";

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

config.alexd = {
	'username': 'justalexxxd',
	'password': 'gofuckyourself6969'
};

config.remoteDatabase = false;

function deploy(environment) {
	if (environment=='staging') {
		config.debugging = true;
		config.ssl = true;
		config.debugging_live = true;
		config.debugging_address = false;
		config.debugging_sync = false;
		config.local = false;
	}
	else if (environment=='production') {
		config.debugging = false;
		config.ssl = true;
		config.debugging_live = false;
		config.debugging_address = false;
		config.debugging_sync = false;
		config.local = false;
	}
	else {
		config.debugging = true;
		config.ssl = false;
		config.debugging_live = true;
		config.debugging_address = false;
		config.debugging_sync = true;
		config.local = true;
	}
}

config.defaultVideo = {
	'title': 'example',
	'performers': ['Myself','Your Mom'],
	'isOriginal': true,
	'duration': 1000*60*config.defaultPrice
};

config.local_keys_path = './src/dev/localConfig.json';
// config.local_google_keys_path = './src/dev/kairosnaps-google.json';
// config.local_data_path = './src/dev/localData.json';

config.logs_backupDir = './src/dev/logs/backup';
config.logs_file = './src/dev/logs/file.log';

require('./keys').call(config);
require('./logger').call(config);
require('./crons').call(config);

module.exports = config;