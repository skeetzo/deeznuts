var config = require('../config/index'),
    logger = config.logger;

const { NodeMediaServer } = require('node-media-server');

var serverOptions = {
  'logType': 3,

  'rtmp': {
    'port': 1935,
    'chunk_size': 60000,
    'gop_cache': true,
    'ping': 60,
    'ping_timeout': 30
  },
  'http': {
    'port': 8000,
    'allow_origin': '*'
  },
  // trans: {
  //   ffmpeg: '/usr/local/bin/ffmpeg',
  //   tasks: [
  //     {
  //       app: 'vod',
  //       ac: 'aac',
  //       mp4: true,
  //       mp4Flags: '[movflags=faststart]',
  //     }
  //   ]
  // }
};

if (config.ssl)
  serverOptions.https = {
    'port': 8443,
    'key':'./dev/privatekey.pem',
    'cert':'./dev/certificate.pem'
  };

if (config.debugging)
  serverOptions.auth = {
    'api' : true,
    'api_user': 'admin',
    'api_pass': 'rtmpsucksdeeck'
  };


var nms = new NodeMediaServer(serverOptions);
nms.run();

// nms.on('preConnect', (id, args) => {
  // console.log('[NodeEvent on preConnect]', `id=${id} args=${JSON.stringify(args)}`);
  // let session = nms.getSession(id);
  // session.reject();
// });

// nms.on('postConnect', (id, args) => {
//   console.log('[NodeEvent on postConnect]', `id=${id} args=${JSON.stringify(args)}`);
// });

// nms.on('doneConnect', (id, args) => {
//   console.log('[NodeEvent on doneConnect]', `id=${id} args=${JSON.stringify(args)}`);
// });

// nms.on('prePublish', (id, StreamPath, args) => {
//   console.log('[NodeEvent on prePublish]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
//   // let session = nms.getSession(id);
//   // session.reject();
// });

nms.on('postPublish', (id, StreamPath, args) => {
  logger.log('[NodeEvent on postPublish]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
  logger.log('Updating Status %s -> %s', config.status, 'Live');
  config.status = 'Live';
});

nms.on('donePublish', (id, StreamPath, args) => {
  logger.log('[NodeEvent on donePublish]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
  logger.log('Updating Status %s -> %s', config.status, 'Not Live');
  config.status = 'Not Live';
});

// nms.on('prePlay', (id, StreamPath, args) => {
//   console.log('[NodeEvent on prePlay]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
//   // let session = nms.getSession(id);
//   // session.reject();
// });

// nms.on('postPlay', (id, StreamPath, args) => {
//   console.log('[NodeEvent on postPlay]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
// });

// nms.on('donePlay', (id, StreamPath, args) => {
//   console.log('[NodeEvent on donePlay]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
// });