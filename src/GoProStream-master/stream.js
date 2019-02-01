#!/usr/bin/env node 
// var config = require('../config/index'),
    // logger = config.logger;
var async = require('async');

var TWEET = null,
    QUIET = false;

process.argv.forEach((val, index) => {
  // console.log(`${index}: ${val}`)
  if (val=='-t') TWEET = process.argv[index+1];
  if (val=='-q') QUIET = true;
});

if (TWEET) console.log('Tweeting: %s');
if (QUIET) console.log('Not Tweeting (Quiet)');

console.log('Streaming to DeezNuts...');
async.series([
  function (step) {
    if (QUIET) return step(null);
    var Twitter = require('../modules/twitter');
    Twitter.tweetLive(TWEET, function (err) {
      if (err) console.warn(err);
      step(null);
    });
  },
  function (step) {
    console.log('Spawning Python process...');
    let {PythonShell} = require('python-shell');
    var path = require('path');
    let options = {
      'mode': 'text',
      'pythonPath': '/usr/bin/python3',
      'pythonOptions': ['-u'], // get print results in real-time
      'scriptPath': path.join(__dirname,'../GoProStream-master'),
      'args': []
    };
    let pyshell = new PythonShell('GoProStream.py', options);

    pyshell.on('message', function (message) {
      console.log(message);
    });

    // end the input stream and allow the process to exit
    pyshell.end(function (err, code, signal) {
      if (err) console.warn(err);
      console.log('The exit code was: ' + code);
      console.log('The exit signal was: ' + signal);
      step(null);   
    });  

    // end after 10 min
    setTimeout(function end() {
      pyshell.kill('SIGINT');
    }, 1000*60*10);
  },
  function (step) {
    if (QUIET) return step(null);
    var Twitter = require('../modules/twitter');
    Twitter.deleteLiveTweet(function (err) {
      if (err) console.warn(err);
      step(null);
    });
  },
  function (step) {
    console.log('Stream Complete');
  }
])