var async = require('async'),
	FFmpeg = require('fluent-ffmpeg'),
	fs = require('fs');



function convert(fileName, callback) {
	console.log('--- Converting: %s', fileName);
	FFmpeg.ffprobe(fileName, function (err, metadata) {
	    // console.dir(metadata);
	    // return;
	    if (metadata) console.log('Probing Metadata');
	    // if (err) return console.error(err);
	    if (!metadata||(metadata&&!metadata.format)) return console.log('Missing File');
		async.waterfall([
			function (step) {
				console.log('--- Splitting ---');
				split(metadata.format, function (err, files) {
					if (err) console.log(err);
					step(null, files);
				});
			},
			function (files, step) {
				if (args.watermark) {
					console.log('--- Watermarking ---');
					watermark(files, function (err) {
						if (err) console.log(err);
						step(null, files);
					});
				}
				else step(null, files);
			},
			function (files, step) {
				if (args.remove||args.watermark){
					console.log('--- Removing ---');
					remove(files, function (err) {
						if (err) console.log(err);
						step(null);
					});
				} 
				else step(null);
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

function split(video, callback) {
	console.log('Extracting: %s', video.filename);
	const duration = Math.round(video.duration);
	console.log('Duration: %s', duration);
	
	// Clip length 
	//	is calculated by checking for an exact division of duration by 10, 9, or 8
	//  defaulting to 10 if none divide into whole numbers

	// console.log(Math.floor(duration/10)+" "+duration/10);
	// console.log(Math.floor(duration/9)+" "+duration/9);
	// console.log(Math.floor(duration/8)+" "+duration/8);
	
	var clip = 10;
    if (Math.floor(duration/10)==duration/10)
    	clip = 10;
    else if (Math.floor(duration/9)==duration/9)
    	clip = 9;
    else if (Math.floor(duration/8)==duration/8)
    	clip = 8;
    console.log('Length: %s', clip);
	
	var index = 0,
		videos = 1,
		series = [],
		j = 1,
		dir = args.folderName,
		// dir = './' + args.folderName,
		filename = video.filename;

	// console.log('Dir: %s', dir);
	// console.log('1: %s', filename);
	filename = filename.replace(dir+'/','');
	// console.log('2: %s', filename);
	filename = filename.substring(0,filename.indexOf('.'));
	// console.log('3: %s', filename);
	// if (args.folderName)
		// dir = args.folderName;
		// .substring(0,video.filename.indexOf('.',1));
	
	// Number of clips
	if (duration>clip)
		videos = Math.floor(duration / clip);
	else if (clip>duration)
		clip = duration;
	console.log('Count: %s', videos);

	// console.log('filename: %s', filename);
	// console.log('filename: %s', video.filename);
	var videoNum = 1;
	var destination = dir+'/'+filename;
	// Check for / make directory
	if (!fs.existsSync(destination)&&!args.debugging)
	    fs.mkdirSync(destination);
	console.log('File: %s', filename);
	console.log('Directory: %s', dir);
	console.log('Destination: %s', destination);
	// return;
	// Convert
	var completedVideos = [];
	for (var i=0;i<videos;i++)
	// for (var i=0;i<3;i++)
		series.push(function (step) {
			var conversion_process = new FFmpeg({ 'source': video.filename, 'timeout': 0 });
			console.log('Video: %s', videoNum);
			conversion_process
			    // .input("watermark.png")
				.seekInput(index)
<<<<<<< HEAD
			    .withVideoBitrate(1024)
			    .withVideoCodec('libx265')
			    .withAspect('16:9')
			    .withFps(24)
			    // .withFps(60)
			    .withAudioBitrate('128k')
			    .withAudioCodec('aac')
=======
			    .withVideoCodec('libx264')
			    .withVideoBitrate(1024)
			    // .withSize('1080x1920')
			    .withAspect('9:16')
			    .withFps(24)
			    .withFps(60)
			    .withAudioCodec('aac')
			    .withAudioBitrate('192k')
			    .withAudioChannels(2)
			    .withAudioFrequency(48000)
>>>>>>> 9459c5a558cc23a44945f9ae08fcd78228f2fc15
			    .toFormat('mp4')
			    .duration(clip)
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
					completedVideos.push(destination+'/'+digitFix(videoNum)+".mp4");
					index += clip;
					videoNum++;
					step(null);
				})
				.saveToFile(destination+'/'+digitFix(videoNum)+".mp4");
		})
	series.push(function (step) {
		callback(null, completedVideos);
	});
	async.series(series);
}


function remove(files, callback) {
	var series = [],
		j = 0;
	// console.log('files: %s', files);
	for (var i=0;i<files.length;i++)
		series.push(function (step) {
			// console.log('file: %s', files[j]);
			fs.unlink(files[j].toString(), (err) => {
			  if (err) console.log(err);
			  console.log('Removed: %s', files[j]);
			  j++;
			  step(null);
			});
		});
	series.push(function (step) {
		console.log('Files Removed');
		callback(null);
	});
	async.series(series);
}

function watermark(files, callback) {
	var series = [],
		videoNum = 1,
		j = 1;
	for (var i=0;i<files.length;i++)
		series.push(function (step) {
			var dir = args.folderName,
				filename = files[videoNum-1];
			console.log('Watermarking: %s', filename);
			var conversion_process = new FFmpeg({ 'source': files[videoNum-1], 'timeout': 0 });
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
					console.log('--- Watermarked: %s', filename.replace('.mp4','-watermarked.mp4'));
					videoNum++;
					step(null);
				})
				.saveToFile(filename.replace('.mp4','-watermarked.mp4'));	
		});
	series.push(function (step) {
		callback(null, files);
	});
	async.series(series);
}





























// .complexFilter([
// 	// main
// 	{
// 		'filter': 'select',
// 		'options': 'between(t\\,'+index+'\\,'+(index+clip)+')',

// 		// {
// 		// 	'e': 'between(t,'+index+','+(index+clip)+')',
// 		// 	'start_t': index,

// 		// },
// 		'inputs': '[0:v]',
// 		'outputs': 'trimmed'
// 	},
// 	{
// 		'filter': 'scale',
// 		'options': {
// 			'w': 1080,
// 			'h': 1920,
// 		},
// 		'inputs': 'trimmed',
// 		'outputs': 'rescaled'
// 	},
// 	// watermark
// 	{
// 		'filter': 'scale',
// 		'options': {
// 			'w': 150,
// 			'h': 150,	
// 		},
// 		'inputs': '[1:v]',
// 		'outputs': 'watermark'
// 	},
// 	{
// 		'filter': 'fade',
// 		'options': { 
// 			'type': 'out',
// 			'alpha': 0,
// 			'color': 'white',
// 			'duration': 3
// 		},
// 		'inputs': 'watermark',
// 		'outputs': 'watermarked'
// 	},
// 	// combi`d
// 	{
// 		'filter': 'overlay',
// 		'options': {
// 			'x': 25,
// 			'y': 25,
// 		},
// 		'inputs': ['rescaled','watermarked'],
// 		'outputs': 'output'
// 	},
	// {
	// 	'filter': 'trim',
	// 	'options': {
	// 		'start': index,
	// 		'end': clip
	// 	},
	// 	'inputs': 'output',
	// 	'outputs': 'output'
	// }


// 	// "[0:v]scale=1080x1920;[1:v]scale=640:-1[bg];[bg][1:v]overlay=25:25:enable='between(t,0,3)'"

// ], 'output')
