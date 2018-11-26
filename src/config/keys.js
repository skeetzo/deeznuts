var fs = require('fs');

module.exports = function() {
    var localConfig = {},
        localGoogle = {};

    try {
        localConfig = fs.readFileSync(this.local_keys_path).toString();
        localConfig = JSON.parse(localConfig);
        localGoogle = fs.readFileSync(this.local_google_keys_path).toString();
        localGoogle = JSON.parse(localGoogle);
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
    this.Google_service_email = localGoogle.client_email || process.env.google_client_email;
    this.Google_key = localGoogle.private_key || process.env.google_private_key;
    this.Google_Oauth_Opts = {
        "email": this.Google_service_email,
        "key": this.Google_key,
        "client_email": this.Google_service_email,
        "private_key": this.Google_key
    };
    this.Google_scopes = [
        'https://mail.google.com/',
        'https://www.googleapis.com/auth/userinfo.email',
        ];
    this.Google_redirect = this.domain+'/google/callback';

    // Google Drive
    // this.Google_client_id = localConfig.Google_id;
    // this.Google_client_secret = localConfig.Google_secret;

    // Google Gmail
    this.gmail_user = localConfig.gmail_user || process.env.google_email;
    this.gmail_password = localConfig.gmail_password || process.env.google_password;
    this.email_return = localConfig.email_return || process.env.google_email_return;
    this.email_service = 'gmail';

    // Google Sheets
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