var path = require('path');

// Deploys Environment Configurations
module.exports = function Deploy_Config() {
	if (!process.env.NODE_ENV) process.env.NODE_ENV = "development";

	this.ssl = false;
	this.local = false;
	this.Blockchain = false;
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

	this.Twitter = false;
	this.Twitter_tweeting = false;
	this.Twitter_deleting_tweet = true;
	this.Twitter_deleting_tweet_on_live = true;
	this.Twitter_tweet_on_archive = false;
	this.remoteDatabase = false;

	this.debugging = false;
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

	// bcoin & wallet
	this.bcoin_delay = 10000;
	this.bcoin_syncing_chain = false;
	this.wallet_confirmations_required = false;
	this.wallet_confirmations_number = 2;
	this.wallet_cache_timeout = 600000; // ten minutes

	if (process.env.NODE_ENV=='development') {
		this.cron_enabled = true;
		this.debugging = true;
		this.debugging_live = true;
		this.remoteDatabase = true;
		this.debugging_address = true;
		this.debugging_reset_db = true;
		this.debugging_reset_files = true;
		this.debugging_reset_logs = true;
		this.debugging_blockchain = true;
		this.local = true;
		this.delete_on_publish = true;
		this.archive_on_publish = true;
		this.backup_on_archive = true;
		this.populateFromFiles = true;	
		//
		// this.live_enabled = true;
		// this.debugging_crons = true;
		// this.upload_all_on_boot = true;
		// this.upload_to_OnlyFans = true;
		this.Blockchain = true;
		this.bcoin_syncing_chain = true;
	}
	else if (process.env.NODE_ENV=='staging') {
		this.cron_enabled = true;
		this.debugging = true;
		this.debugging_live = true;
		this.ssl = true;
		this.Twitter = true;
		this.delete_on_publish = true;
		//
		// this.debugging_blockchain = true;
		// this.debugging_reset_db = true;
		// this.debugging_reset_files = true;
		// this.debugging_address = true;
		// this.debugging_sync = true;
		// this.remoteDatabase = true;
		// this.archive_on_publish = true;
		// this.backup_on_archive = true;
		// this.deleteMissing = true;
		// this.debugging_crons = true;
		// this.debugging_clean_fileNames = true;
		//
		this.Blockchain = true;
		this.bcoin_syncing_chain = true;
	}
	else if (process.env.NODE_ENV=='production') {
		this.cron_enabled = true;
		this.ssl = true;
		this.archive_on_publish = true;
		this.populateFromFiles = true;
		this.deleteMissing = true;
		this.backup_on_archive = true;
		this.upload_to_OnlyFans = true;
		this.concatting = true;
		this.concatenate_on_publish = true;
		//
		// this.Twitter = true;
		// this.Twitter_tweeting = true;
		// this.Twitter_tweet_on_archive = true;
		// this.delete_on_publish = true;
		// this.remoteDatabase = true;
		// this.live_enabled = true;
		// this.backup_db = true;
		// this.upload_all_on_boot = true;
		// this.upload_on_archive = true;
		// this.upload_force_save = true; // forces all videos to save as uploaded before boot can do anything else
		//
		this.Blockchain = true;
		this.bcoin_syncing_chain = true;
		this.wallet_confirmations_required = true;
		this.wallet_confirmations_number = 6;
	}
	else if (process.env.NODE_ENV=='pi') {
		this.debugging = true;
		this.database_redis = false;
		this.local = true;
		this.remoteDatabase = true;
		this.archive_on_publish = true;
		this.concatenate_on_publish = true;
		this.live_enabled = true;
		this.backup_on_archive = true;
		this.delete_on_backup = true;
		this.database_retain = true;
		this.database_type = "remote";
		this.deleteMissing = true;
		this.populateFromFiles = true;
		this.upload_to_OnlyFans = true;
		//
		// this.delete_on_publish = true;
		// this.upload_all_on_boot = true;
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