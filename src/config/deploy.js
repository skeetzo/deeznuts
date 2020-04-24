var path = require('path');

// Deploys Environment Configurations
module.exports = function Deploy_Config() {
	if (!process.env.NODE_ENV) process.env.NODE_ENV = "development";
	var environment = process.env.NODE_ENV;

	this.debugging = false;
	this.ssl = false;
	this.local = false;

	this.cron_enabled = false;
	this.emailing_debugging = false;

	this.createPreviews = true;

	this.backup_db = false;
	this.backupToOnlyFans = false;
	this.archive_on_publish = false;
	this.delete_on_publish = false;
	this.deleteMissing = false;

	this.backup_on_archive = false;
	this.upload_on_archive = false;

	this.PayPal = false;
	this.PayPal_environment = 'sandbox';
	this.PayPal_syncing_webhooks = false;

	this.Twitter = false;
	this.Twitter_tweeting = false;
	this.Twitter_deleting_tweet = true;
	this.Twitter_deleting_tweet_on_live = true;
	this.Twitter_tweet_on_archive = false;
	this.remoteDatabase = false;

	this.debugging_blockchain = false;
	this.debugging_live = false;
	this.debugging_address = false;
	this.debugging_sync = false;

	this.debugging_reset_db = false;
	this.debugging_reset_files = false;
	this.debugging_reset_logs = false;
	this.debugging_backup_db = false;

	this.debugging_crons = false;

	this.debugging_paypal = false;
	this.debugging_paypal_reset_plans = false;
	this.debugging_clean_fileNames = false;
	this.live_enabled = false;
	this.repair_moov = false;

	this.upload_all_on_boot = false;
	this.upload_to_OnlyFans = false;
	this.upload_force_save = false;

	this.populateFromFiles = false;
	this.concatenate_on_publish = false;

	this.concatting = false;

	this.database_retain = false;
	this.database_type = "local";
	this.database_redis = false;

	if (environment=='development') {
		this.cron_enabled = true;
		this.debugging = true;
		this.debugging_live = true;
		this.remoteDatabase = true;
		// this.debugging_address = true;
		// this.debugging_sync = true;
		// this.debugging_reset_db = true;
		// this.debugging_reset_files = true;
		// this.debugging_reset_logs = true;
		// this.debugging_blockchain = true;
		this.local = true;
		// this.remoteDatabase = true;
		// this.delete_on_publish = true;
		this.archive_on_publish = true;
		// this.live_enabled = true;
		this.backup_on_archive = true;
		// this.debugging_crons = true;
		// this.debugging_paypal = true;
		// this.debugging_paypal_reset_plans = true;
		this.populateFromFiles = true;	
		// this.upload_all_on_boot = true;
		// this.upload_to_OnlyFans = true;
	}
	else if (environment=='staging') {
		this.cron_enabled = true;
		this.debugging = true;
		// this.debugging_blockchain = true;
		this.debugging_live = true;
		// this.debugging_reset_db = true;
		// this.debugging_reset_files = true;
		// this.debugging_address = true;
		// this.debugging_sync = true;
		this.ssl = true;
		this.PayPal = true;
		this.PayPal_environment = 'sandbox';
		this.Twitter = true;
		// this.remoteDatabase = true;
		// this.archive_on_publish = true;
		// this.backup_on_archive = true;
		this.delete_on_publish = true;
		// this.deleteMissing = true;
		// this.debugging_crons = true;
		// this.debugging_clean_fileNames = true;
	}
	else if (environment=='production') {
		this.cron_enabled = true;
		this.ssl = true;
		this.PayPal = true;
		this.PayPal_environment = 'live';
		this.PayPal_syncing_webhooks = false;
		// this.Twitter = true;
		// this.Twitter_tweeting = true;
		// this.Twitter_tweet_on_archive = true;
		this.archive_on_publish = true;
		// this.delete_on_publish = true;
		// this.remoteDatabase = true;
		this.populateFromFiles = true;
		// this.live_enabled = true;
		// this.backup_db = true;
		// this.upload_all_on_boot = true;
		this.deleteMissing = true;
		this.backup_on_archive = true;
		// this.upload_on_archive = true;
		this.upload_to_OnlyFans = true;
		// this.upload_force_save = true; // forces all videos to save as uploaded before boot can do anything else
		this.concatting = true;
		this.concatenate_on_publish = true;
	}
	else if (environment=='pi') {
		this.debugging = true;
		this.database_redis = false;
		this.local = true;
		this.remoteDatabase = true;
		this.archive_on_publish = true;
		// this.delete_on_publish = true;
		this.concatenate_on_publish = true;
		// this.live_enabled = true;
		this.backup_on_archive = true;
		this.delete_on_backup = true;
		this.database_retain = true;
		this.database_type = "remote";
		this.deleteMissing = true;
		this.populateFromFiles = true;
		// this.upload_all_on_boot = true;
		// this.upload_to_OnlyFans = true;
	}

	// Mount Paths
	var mountName = this.botName.toLowerCase();
	this.mnt_path = '/opt/apps/'+mountName;
	// if (process.env.NODE_ENV!="development")
		// this.mnt_path = '/mnt/'+mountName;	
		// this.mnt_path = '/mnt/apps/'+mountName;	
	this.local_keys_path = path.join(this.mnt_path, 'dev/localConfig.json');
	this.local_google_keys_path = path.join(this.mnt_path, 'dev/google.json');
	// this.logs_dir = path.join(this.mnt_path, 'logs');
	this.logs_dir = path.join('/var/log/apps', mountName);
	this.logs_file = path.join(this.logs_dir, 'file.log');
	this.videosPath = path.join(this.mnt_path, 'videos');
	this.imagesPath = path.join(this.mnt_path, 'images');
	this.watermarkPath = path.join(this.imagesPath, "watermark.png");
	this.workingVideoPath = path.join(this.videosPath, "working.mp4");
}



// update ffmpeg to 4.0 on rasp pi