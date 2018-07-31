var config = require('../config/index'),
	logger = config.logger,
	async = require('async'),
	FFmpeg = require('fluent-ffmpeg'),
	path = require('path'),
	fs = require('fs');

// edit video into 10 sec preview with watermark
function convert(fileName, callback) {
	console.log('--- Converting: %s', fileName);
	fileName = path.join(__dirname, '../public/videos', fileName);
	logger.log(fileName);
	FFmpeg.ffprobe(fileName, function (err, metadata) {
		if (err) return callback(err);
	    console.dir(metadata);
	    // return;
	    if (metadata) console.log('Probing Metadata');
	    // if (err) return console.error(err);
	    if (!metadata||(metadata&&!metadata.format)) return callback('Missing File')
		async.waterfall([
			function (step) {
				console.log('--- Extracting ---');
				console.log('metadata.format: %s', metadata.format);
				extract(metadata.format, function (err, file) {
					if (err) console.log(err);
					step(null, file);
				});
			},
			function (file, step) {
				// if (args.watermark) {
					console.log('--- Watermarking ---');
					watermark(file, function (err) {
						if (err) console.log(err);
						step(null, file);
					});
				// }
				// else step(null, file);
			},
			function (step) {
				console.log('--- Conversion Complete: %s', fileName);
				callback(null);
			}
		], function (err) {
			if (err) console.log(err);
			callback(null);
		});
	});
}
module.exports.convert = convert;

function extract(video, callback) {
	console.log('Extracting: %s', video.filename);
	const duration = Math.round(video.duration);
	console.log('Duration: %s', duration);
	
	var filename = video.filename;
	var dir = path.join(__dirname, 'public/videos');
	console.log('dir: %s', dir);
	// filename = filename.replace(dir+'/','');
	// filename = filename.substring(0,filename.indexOf('.'));

	var destination = dir+'/'+filename,
		newFile = destination+'/'+filename+"-preview.mp4";
	// Check for / make directory
	if (!fs.existsSync(destination)&&!args.debugging)
	    fs.mkdirSync(destination);
	console.log('File: %s', filename);
	console.log('Directory: %s', dir);
	console.log('Destination: %s', destination);
	console.log('New File: %s', newFile);
	callback(null, newFile);
	return;

	// Convert
	var conversion_process = new FFmpeg({ 'source': video.filename, 'timeout': 0 });
	console.log('Video: %s', videoNum);
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
			console.log("Extraction Started");
		})
		.on('error', function (err, stdout, stderr) {
			console.log("Extraction Failed"); 
			console.log(err);
		})
		.on('progress', function (progress) {
			// console.dir(progress);
			if (!args.quiet)
				console.log("Extracting: %s%", Math.round(progress.percent*videos));
		})
		.on('end', function () {
			console.log("Extraction Finished");
			callback(null, newFile);
		})
		.saveToFile(newFile);
}

function watermark(file, callback) {
	var dir = args.folderName,
		filename = file[videoNum-1];
	console.log('Watermarking: %s', filename);
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
			console.log("Watermarking Started");
		})
		.on('error', function (err, stdout, stderr) {
			console.log("Watermarking Failed"); 
			console.log(err);
		})
		.on('progress', function (progress) {
			// console.dir(progress);
			if (!args.quiet)
				console.log("Watermarking: %s%", Math.round(progress.percent));
		})
		.on('end', function () {
			console.log("Watermarking Finished");
			console.log('--- Watermarked: %s', filename);
			step(null);
		})
		.saveToFile(filename);	
}











