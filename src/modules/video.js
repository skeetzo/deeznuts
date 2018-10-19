var config = require('../config/index'),
	logger = config.logger,
	async = require('async'),
	FFmpeg = require('fluent-ffmpeg'),
	path = require('path'),
	fs = require('fs');

// edit video into 10 sec preview with watermark
function convert(fileName, callback) {
	logger.log('--- Converting: %s', fileName);
	fileName = path.join(__dirname, '../public/videos', fileName);
	logger.log(fileName);
	FFmpeg.ffprobe(fileName, function (err, metadata) {
		if (err) return callback(err);
	    // logger.log(JSON.stringify(metadata,null,4));
	    // return;
	    if (metadata) logger.log('Probing Metadata');
	    // if (err) return logger.error(err);
	    if (!metadata||(metadata&&!metadata.format)) return callback('Missing File')
		async.waterfall([
			function (step) {
				logger.log('--- Extracting ---');
				// logger.log('metadata.format: %s', JSON.stringify(metadata.format, null, 4));
				extract(metadata.format, function (err, file) {
					step(err, file);
				});
			},
			function (file, step) {
				logger.log('--- Watermarking ---');
				watermark(file, function (err) {
					step(err, file);
				});
			},
			function (step) {
				logger.log('--- Conversion Complete: %s', fileName);
				callback(null);
			}
		], function (err) {
			callback(err);
		});
	});
}
module.exports.convert = convert;

function extract(video, callback) {
	logger.log('Extracting: %s', video.filename);
	const duration = Math.round(video.duration);
	logger.log('Duration: %s', duration);
	var newFile = video.filename.replace(".mp4","-preview.mp4");
	logger.log('New File: %s', newFile);

	// Convert
	var conversion_process = new FFmpeg({ 'source': video.filename, 'timeout': 0 });
	conversion_process
	    // .input("watermark.png")
	    .withVideoBitrate(1024)
	    // .withVideoCodec('libx265')
	    .withAspect('16:9')
	    // .withFps(24)
	    .withFps(30)
	    .withAudioBitrate('128k')
	    .withAudioCodec('aac')
	    .toFormat('mp4')
	    .duration(10)
		.on('start', function (commandLine) {
			logger.log("Extraction Started");
		})
		.on('error', function (err, stdout, stderr) {
			logger.log("Extraction Failed"); 
			callback(err);
			// logger.log("ffmpeg stdout:\n" + stdout);
			// logger.log("ffmpeg stderr:\n" + stderr);
		})
		.on('progress', function (progress) {
		    process.stdout.write('Extracting: '+Math.round(progress.percent)+'%\033[0G');
		})
		.on('end', function () {
			logger.log("Extraction Finished");
			callback(null, newFile);
		})
		.saveToFile(newFile);
}

function watermark(file, callback) {
	logger.log('Watermarking: %s', file);
	var conversion_process = new FFmpeg({ 'source': file, 'timeout': 0 });
	conversion_process
	    .input(path.resolve(__dirname, "../public/images/watermark.png"))
		.complexFilter([
			{
				'filter': 'scale',
				'options': {
					'w': 150,
					'h': 150,	
				},
				'inputs': '[1:v]',
				'outputs': 'watermark'
			},
			// {
			// 	'filter': 'fade',
			// 	'options': { 
			// 		'type': 'out',
			// 		'alpha': 1,
			// 		'color': 'white',
			// 		'duration': 3
			// 	},
			// 	'inputs': 'watermark',
			// 	'outputs': 'watermarked'
			// },
			// combined
			{
				'filter': 'overlay',
				'options': {
					'x': 25,
					'y': 25,
				},
				'inputs': ['[0:v]','watermark'],
				'outputs': 'output'
			},
			], 'output')
	    .toFormat('mp4')
		.on('start', function (commandLine) {
			logger.log("Watermarking Started");
		})
		.on('error', function (err, stdout, stderr) {
			logger.log("Watermarking Failed"); 
			callback(err);
		})
		.on('progress', function (progress) {
			process.stdout.write("Watermarking: "+Math.round(progress.percent)+'%\033[0G');
		})
		.on('end', function () {
			logger.log("Watermarking Finished");
			logger.log('--- Watermarked: %s', file);
			callback(null);
		})
		.saveToFile(file.replace('.mp4','-w.mp4'));	
}











