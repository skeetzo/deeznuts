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
	    logger.log(JSON.stringify(metadata,null,4));
	    // return;
	    if (metadata) logger.log('Probing Metadata');
	    // if (err) return logger.error(err);
	    if (!metadata||(metadata&&!metadata.format)) return callback('Missing File')
		async.waterfall([
			function (step) {
				logger.log('--- Extracting ---');
				logger.log('metadata.format: %s', metadata.format);
				extract(metadata.format, function (err, file) {
					if (err) logger.log(err);
					step(null, file);
				});
			},
			function (file, step) {
				// if (args.watermark) {
					logger.log('--- Watermarking ---');
					watermark(file, function (err) {
						if (err) logger.log(err);
						step(null, file);
					});
				// }
				// else step(null, file);
			},
			function (step) {
				logger.log('--- Conversion Complete: %s', fileName);
				callback(null);
			}
		], function (err) {
			if (err) logger.log(err);
			callback(null);
		});
	});
}
module.exports.convert = convert;

function extract(video, callback) {
	logger.log('Extracting: %s', video.filename);
	const duration = Math.round(video.duration);
	logger.log('Duration: %s', duration);
	
	var filename = video.filename;
	filename = path.join(__dirname, '../public/videos', filename);
	var newFile = filename+"-preview.mp4";

	logger.log('File: %s', filename);
	logger.log('New File: %s', newFile);
	callback(null, newFile);
	return;

	// Convert
	var conversion_process = new FFmpeg({ 'source': video.filename, 'timeout': 0 });
	logger.log('Video: %s', videoNum);
	conversion_process
	    // .input("watermark.png")
	    .withVideoBitrate(1024)
	    .withVideoCodec('libx265')
	    .withAspect('16:9')
	    .withFps(24)
	    // .withFps(60)
	    .withAudioBitrate('128k')
	    .withAudioCodec('aac')
	    .toFormat('mp4')
	    .duration(10)
		.on('start', function (commandLine) {
			logger.log("Extraction Started");
		})
		.on('error', function (err, stdout, stderr) {
			logger.log("Extraction Failed"); 
			logger.log(err);
		})
		.on('progress', function (progress) {
			logger.log("Extracting: %s%", Math.round(progress.percent*videos));
		})
		.on('end', function () {
			logger.log("Extraction Finished");
			callback(null, newFile);
		})
		.saveToFile(newFile);
}

function watermark(file, callback) {
	var dir = args.folderName,
		filename = file[videoNum-1];
	logger.log('Watermarking: %s', filename);
	var conversion_process = new FFmpeg({ 'source': file[videoNum-1], 'timeout': 0 });
	conversion_process
	    .input("watermark.png")
		.complexFilter([
			// watermarkvideos
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
			logger.log(err);
		})
		.on('progress', function (progress) {
			logger.log("Watermarking: %s%", Math.round(progress.percent));
		})
		.on('end', function () {
			logger.log("Watermarking Finished");
			logger.log('--- Watermarked: %s', filename);
			step(null);
		})
		.saveToFile(filename);	
}











