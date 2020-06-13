var config = require('../config/index'),
    logger = config.logger,
    async = require('async');

var Video = require('../models/video');

const { NodeMediaServer } = require('node-media-server');

var serverOptions = {
  'logType': 3,

  'rtmp': {
    'port': 8935,
    'chunk_size': 60000,  
    'gop_cache': true,
    'ping': 60,
    'ping_timeout': 30
  },

  'http': {
    'port': 8000,
    'allow_origin': 'no-cors',
    'mediaroot': config.videosPath
  }
};

if (process.env.NODE_ENV!="development")
  serverOptions.http.allow_origin = config.domain;

serverOptions.auth = {};

if (config.ssl) {
  serverOptions.https = {
    'port': 8643,
    'key': config.ssl_key,
    'cert': config.ssl_cert
  };
  serverOptions.auth = {
    'play': true,
    'publish': true,
    'secret': config.streamKey
  }
}

if (config.debugging) {
  serverOptions.auth.api = true;
  serverOptions.auth.api_user = 'admin';
  serverOptions.auth.api_pass = 'rtmpsucksdeeck';
}

if (config.streamRecording)
  // record to mp4
  serverOptions.trans = {
    'ffmpeg': '/usr/bin/ffmpeg',
    'tasks': [
      {
        'app': 'live',
        'ac': 'copy',
        // 'ac': 'aac',
        'mp4': true,
        'mp4Flags': '[movflags=faststart]'
      },

    // {
    //   app: 'live',
    //   // ac: 'aac',
    //   hls: true,
    //   hlsFlags: '[hls_time=2:hls_list_size=3:hls_flags=delete_segments]',
    //   dash: true,
    //   dashFlags: '[f=dash:window_size=3:extra_window_size=5]'
    // },
    // {
      // 'app': 'live',
      // 'ac': 'aac',
      // 'dash': true,
      // 'dashFlags': '[f=dash:window_size=3:extra_window_size=5]'
    // }
    ]
  }

var nms = new NodeMediaServer(serverOptions);
nms.run();

var connectTimeout;
var disconnectTimeout;
var disconnectCount = 0;

nms.on('postPublish', (id, StreamPath, args) => {
  logger.log('[NodeEvent on postPublish]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
  clearTimeout(connectTimeout);
  clearTimeout(disconnectTimeout);
  disconnectCount = 0;
  if (config.live_enabled)
    connectTimeout = setTimeout(function () {
      logger.log('Updating Status %s -> %s', config.live_status, 'Live');
      config.live_status = 'Live';
    }, config.rtmpTimeout);
  else logger.debug("Live Disabled")
});

nms.on('donePublish', (id, StreamPath, args) => {
  logger.log('[NodeEvent on donePublish]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
  clearTimeout(connectTimeout);
  clearTimeout(disconnectTimeout);
  disconnectCount++;
  disconnectTimeout = setTimeout(function () {
    logger.log('Updating Status %s -> %s', config.live_status, 'Not Live');
    config.live_status = 'Not Live';
    async.series([
      // concatenate if multiple disconnects between final end
      function (step) {
        if (disconnectCount>1||!config.concatenate_on_publish)
          return step(null);
        logger.log("Concatting on Publish");
        logger.debug(`disconnect count: ${disconnectCount}`)
        Video.concatLives(function (err) {
          if (err) logger.warn(err);
          step(null);
        });
      },
      // archive or delete
      function (step) {
        if (config.delete_on_publish) {
          logger.log("Deleting on Publish");
          Video.deleteOnPublish(function (err) {
            if (err) logger.warn(err);
            else logger.log("Stream Deleted Successfully!");
          });
        }
        else if (config.archive_on_publish) {
          logger.log("Archiving on Publish");
          Video.processPublished(function (err) {
            if (err) logger.warn(err);
            else logger.log("Stream Published Successfully!");
          });
        }
      }
    ]);
  }, config.rtmpTimeout);
});

// nms.on('preConnect', (id, args) => {
  // logger.log('[NodeEvent on preConnect]', `id=${id} args=${JSON.stringify(args)}`);
  // let session = nms.getSession(id);
  // session.reject();
// });

// nms.on('postConnect', (id, args) => {
  // logger.log('[NodeEvent on postConnect]', `id=${id} args=${JSON.stringify(args)}`);
// });

// nms.on('doneConnect', (id, args) => {
  // logger.log('[NodeEvent on doneConnect]', `id=${id} args=${JSON.stringify(args)}`);
// });

// nms.on('prePublish', (id, StreamPath, args) => {
  // logger.log('[NodeEvent on prePublish]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
  // let session = nms.getSession(id);
  // session.reject();
// });

// nms.on('prePlay', (id, StreamPath, args) => {
  // logger.log('[NodeEvent on prePlay]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
  // let session = nms.getSession(id);
  // session.reject();
// });

// nms.on('postPlay', (id, StreamPath, args) => {
  // logger.log('[NodeEvent on postPlay]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
// });

// nms.on('donePlay', (id, StreamPath, args) => {
  // logger.log('[NodeEvent on donePlay]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
// });