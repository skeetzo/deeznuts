var fs = require('fs');
    // google = require('googleapis'),
    // OAuth2 = google.auth.OAuth2;

module.exports = function() {
    var localConfig = {};

    try {
        localConfig = fs.readFileSync(this.local_keys_path).toString();
        localConfig = JSON.parse(localConfig);
    }
    catch (err) {
        this.localConfig = {};
    }

    // Amazon S3
    this.aws = {
    	AWS_ACCESS_KEY : localConfig.AWS_ACCESS_KEY || process.env.AWS_ACCESS_KEY,
    	AWS_SECRET_KEY : localConfig.AWS_SECRET_KEY || process.env.AWS_SECRET_KEY,
    	S3_BUCKET_Twitter : localConfig.S3_BUCKET_Twitter || process.env.S3_BUCKET_Twitter,
    	S3_BUCKET_main : {
    		Bucket :  localConfig.S3_BUCKET_Twitter || process.env.S3_BUCKET_Twitter,
    		Key :  localConfig.AWS_SECRET_KEY || process.env.AWS_SECRET_KEY
    	}
    }

    // Blockchain
    this.blockchainKey = localConfig.blockchainKey || process.env.blockchainKey;
    this.blockchainXpub = localConfig.blockchainXpub || process.env.blockchainXpub;

    // Google
    this.Google_service_email = localConfig.client_email || process.env.Google_service_email;
    this.Google_key = localConfig.private_key || process.env.Google_key;
    // this.Google_keyFile = localConfig.Google_keyFile || process.env.Google_keyFile;
    this.Google_Oauth_Opts = {
        "email": this.Google_service_email,
        "key": this.Google_key,
        "client_email": this.Google_service_email,
        "private_key": this.Google_key
    };
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
    this.Google_Spreadsheet_id = localConfig.Google_Spreadsheet_id || process.env.Google_Spreadsheet_id;

    // Mongo
    this.MONGODB_URI = localConfig.MONGODB_URI || process.env.MONGODB_URI;
    if (this.local&&!this.debugging) this.MONGODB_URI = localConfig.MONGODB_URI_local;

    // Twitter
	this.Twitter_consumer_key = localConfig.Twitter_AlexsDBot_consumer_key || process.env.Twitter_consumer_key; 
	this.Twitter_consumer_secret = localConfig.Twitter_AlexsDBot_consumer_secret || process.env.Twitter_consumer_secret;
	this.Twitter_access_token = localConfig.Twitter_AlexsDBot_access_token || process.env.Twitter_access_token;
	this.Twitter_access_token_secret = localConfig.Twitter_AlexsDBot_access_token_secret || process.env.Twitter_access_token_secret;

    this.TwitterConfig = {
    	consumer_key: this.Twitter_consumer_key, 
    	consumer_secret: this.Twitter_consumer_secret,
    	access_token: this.Twitter_access_token,
    	access_token_secret: this.Twitter_access_token_secret
    };
}