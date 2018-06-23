// Config file
var config = {};

// Debugging
config.debugging = process.env.npm_package_config_debugging || false;
config.debugging_live = false;

config.Crons_On = true;

// App Settings
config.botName = "DeezNuts";
config.port = Number(process.env.PORT || 3000);

// Site Settings
config.title = "Alex D.'s Nuts";
config.siteTitle = "AlexDeezNuts.com";
config.domain = "alexdeeznuts.com";
if (config.debugging) config.domain = "localhost";
config.author = "Skeetzo";
config.description = "Porn Star Streamer";
config.Google_Analytics = "";

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
config.blockchainCallback = 'http://'+config.domain+config.blockchainRoute;
config.blockchainSecret = "gofuckyourself6969";
config.streamKey = "yourmotherisadirtywhore";

config.siteData = 
	{ 	
		title: config.title,
		siteTitle: config.siteTitle,
		domain: config.domain,
		author: config.author,
		description: config.description,
		Google_Analytics: config.Google_Analytics,
		status: config.status
	};

require('./keys.js').call(config);
require('./logger.js').call(config);
require('./crons.js').call(config);

module.exports = config;