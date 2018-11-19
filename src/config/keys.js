var fs = require('fs');

module.exports = function() {
    var localConfig = {};

    try {
        localConfig = fs.readFileSync(this.local_keys_path).toString();
        localConfig = JSON.parse(localConfig);
        console.log('Local Keys Loaded; Loading Environment: %s', process.env.NODE_ENV);
    }
    catch (err) {
        console.log('Local Keys Not Found');
        process.exit(1);
        return;
    }

    // Blockchain
    this.blockchainKey = localConfig.blockchainKey || process.env.blockchainKey;
    this.blockchainXpub = localConfig.blockchainXpub || process.env.blockchainXpub;

    // Google
    // this.Google_service_email = localConfig.client_email || process.env.Google_service_email;
    // this.Google_key = localConfig.private_key || process.env.Google_key;
    // this.Google_keyFile = localConfig.Google_keyFile || process.env.Google_keyFile;
    // this.Google_Oauth_Opts = {
        // "email": this.Google_service_email,
        // "key": this.Google_key,
        // "client_email": this.Google_service_email,
        // "private_key": this.Google_key
    // };
 //    this.Google_scopes = ['https://www.googleapis.com/auth/plus.me',
 //        'https://www.googleapis.com/auth/calendar',
 //         'https://www.googleapis.com/auth/drive',
 //         'https://www.googleapis.com/auth/drive.file',
 //         'https://spreadsheets.google.com/feeds',
 //         'https://docs.google.com/feeds'];
	// this.Google_auth = new google.auth.JWT(
	//     this.Google_service_email,
	//     null,
 //        this.Google_key,
	//     this.Google_scopes,
 //        null);

 //    this.Google_id = localConfig.Google_id || process.env.Google_id;
 //    this.Google_secret = localConfig.Google_secret || process.env.Google_id;

    // Google Sheets - Twitter
    // this.Google_Spreadsheet_id = localConfig.Google_Spreadsheet_id || process.env.Google_Spreadsheet_id;

    // Mongo
    this.MONGODB_URI = localConfig.MONGODB_URI || process.env.MONGODB_URI;
    if (process.env.NODE_ENV!='production') this.MONGODB_URI = localConfig.MONGODB_URI_dev;
    if (this.remoteDatabase) this.MONGODB_URI = localConfig.MONGODB_URI_remote;

    // Twitter
	this.Twitter_consumer_key = localConfig.Twitter_consumer_key || process.env.Twitter_consumer_key; 
	this.Twitter_consumer_secret = localConfig.Twitter_consumer_secret || process.env.Twitter_consumer_secret;
	this.Twitter_access_token = localConfig.Twitter_access_token || process.env.Twitter_access_token;
	this.Twitter_access_token_secret = localConfig.Twitter_access_token_secret || process.env.Twitter_access_token_secret;
    this.TwitterConfig = {
    	consumer_key: this.Twitter_consumer_key, 
    	consumer_secret: this.Twitter_consumer_secret,
    	access_token: this.Twitter_access_token,
    	access_token_secret: this.Twitter_access_token_secret
    };
}