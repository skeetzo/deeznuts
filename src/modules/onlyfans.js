var config = require('../config/index'),
    logger = config.logger,
    async = require('async');

module.exports.spawn = function(args, callback) {
  async.series([
    function (step) {
      logger.log('Spawning Python process...');
      let {PythonShell} = require('python-shell');
      var path = require('path');
      let options = {
        'mode': 'text',
        'pythonPath': '/usr/bin/python3',
        'pythonOptions': ['-u'],
        'scriptPath': '/usr/local/lib/python3.5/dist-packages/OnlySnarf',
        'args': args
      };
      let pyshell = new PythonShell('onlysnarf.py', options);
      pyshell.on('message', function (message) {
        logger.log(message);
      });
      // end the input stream and allow the process to exit
      pyshell.end(function (err, code, signal) {
        if (err) logger.warn(err);
        logger.debug('The exit code was: ' + code);
        logger.debug('The exit signal was: ' + signal);
        step(null);
      });  
    },
    function (step) {
      logger.log('--- OnlyFans Upload Completed ---');
      callback(null);      
    },
  ]);
}