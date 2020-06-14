var config = require('../config/index'),
    logger = config.logger,
    async = require('async');

module.exports.spawn = function(args, callback) {
  async.series([
    function (step) {
      logger.log('--- OnlySnarf Start ---');
      let {PythonShell} = require('python-shell');
      var path = require('path');
      let options = {
        'mode': 'text',
        'pythonPath': '/usr/bin/python3',
        'pythonOptions': ['-u'],
        'scriptPath': '/usr/local/bin',
        'args': args
      };
      let pyshell = new PythonShell('onlysnarfpy', options);
      pyshell.on('message', function (message) {
        logger.log(message);
      });
      // end the input stream and allow the process to exit
      pyshell.end(function (err, code, signal) {
        if (err) logger.warn(err.message);
        logger.debug('The exit code was: ' + code);
        logger.debug('The exit signal was: ' + signal);
        if (code==1) return step("Error: Unable to complete OnlySnarf")
        step(null);
      });  
    },
    function (step) {
      logger.log('--- OnlyFans End ---');
      callback(null);      
    },
  ]);
}