var config = require('../config/index'),
    logger = config.logger;

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
    'allow_origin': '*',
    'mediaroot': config.videosPath
  }
};

if (config.ssl) {
  serverOptions.https = {
    'port': 8643,
    'key': config.ssl_key,
    'cert': config.ssl_cert,
    'allow_origin': '*'
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
    // {
    //   app: 'live',
    //   // ac: 'aac',
    //   hls: true,
    //   hlsFlags: '[hls_time=2:hls_list_size=3:hls_flags=delete_segments]',
    //   dash: true,
    //   dashFlags: '[f=dash:window_size=3:extra_window_size=5]'
    // },
    {
      'app': 'live',
      // 'ac': 'aac',
      'ac': 'copy',
      'mp4': true,
      'mp4Flags': '[movflags=faststart]',
      // 'dash': true,
      // 'dashFlags': '[f=dash:window_size=3:extra_window_size=5]'
    }
    ]
  }

var nms = new NodeMediaServer(serverOptions);
nms.run();

nms.on('postPublish', (id, StreamPath, args) => {
  logger.log('[NodeEvent on postPublish]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
  logger.log('Updating Status %s -> %s', config.status, 'Live');
  config.status = 'Live';
  if (config.Twitter_tweeting_on_live)
    require('../modules/twitter').tweetLive(function (err) {
      if (err) logger.warn(err);
    });
});

nms.on('donePublish', (id, StreamPath, args) => {
  logger.log('[NodeEvent on donePublish]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
  logger.log('Updating Status %s -> %s', config.status, 'Not Live');
  config.status = 'Not Live';
  if (config.archive_on_publish)
    setTimeout(function () {
      require('../models/video').processPublished(function (err) {
        if (err) logger.warn(err);
      });
    }, config.archive_delay);
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