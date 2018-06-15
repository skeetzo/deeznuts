// Config file

var config = {};

// Debugging
config.debugging = true;
config.debugging_live = false;

// App Settings
config.botName = "DeezNuts";
config.port = Number(process.env.PORT || 3000);

// Site Settings
config.title = "Alex D.'s Nuts";
config.domain = "alexdeeznuts.com";
config.author = "Skeetzo";
config.description = "Porn Star Streamer";
config.Google_Analytics = "";

config.preview_video = "vidoeo/uhh.mp4";
config.thumbnail = "img/thumbnail.png";

config.status = "Not Live";

// Bitcoin
config.bitcoin_address = "abunchoflettersand123";
config.bitcoin_qr = "http://placehold.it/150x150";
config.bitcoin_link = "bitcoin:"+config.bitcoin_address;

config.blockchainCallback = 'http://alexdeeznuts.herokuapp.com/tip';

config.siteData = 
	{ 	
		title: config.title,
		domain: config.domain,
		preview_video: config.preview_video,
		thumbnail: config.thumbnail,
		bitcoin_link: config.bitcoin_link,
		bitcoin_qr: config.bitcoin_qr,
		bitcoin_address: config.bitcoin_address,
		description: config.description,
		author: config.author,
		// logged_in: false,
		status: config.status,

		Google_Analytics: config.Google_Analytics,
	};

require('./keys.js').call(config);
require('./logger.js').call(config);
// require('./crons.js').call(config);

module.exports = config;