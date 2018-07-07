// Config file
var config = {};

// Debugging
config.debugging = true;
config.ssl = false;
config.debugging_live = false;
config.local = false;

config.Crons_On = true;

// App Settings
config.botName = "DeezNuts";
config.port = Number(process.env.PORT || 3020);

// Site Settings
config.title = "Alex D.'s Nuts";
config.siteTitle = "AlexDeezNuts.com";
config.domain = "alexdeeznuts.com";
if (config.local) config.domain = "localhost";
if (config.debugging) config.domain = "http://"+config.domain;
else config.domain = "https://"+config.domain;
config.author = "Skeetzo";
config.description = "Porn Star Streamer";
config.Google_Analytics = "UA-82463743-8";

config.port = 3020;

config.pages = ['privacy','terms','support'];

// DeezNuts Settings
config.conversionRate = 6; // $1 per 6 minutes
config.defaultTime = 60; // time in seconds
if (config.debugging) config.defaultTime = 60*60*23+45*60;
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

var live_url = config.domain+":8443/live/stream.flv?sign=";
if (config.debugging) live_url = config.domain+":8000/live/stream.flv";

config.siteData = 
	{ 	
		title: config.title,
		siteTitle: config.siteTitle,
		domain: config.domain,
		author: config.author,
		description: config.description,
		Google_Analytics: config.Google_Analytics,
		status: config.status,
		live_url: live_url
	};

config.alexd = {
	'username': 'justalexxxd',
	'password': 'gofuckyourself6969'
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