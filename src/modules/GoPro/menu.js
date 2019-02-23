// Skeetzo
// 2/12/2018
// ASCII
// show menu and wait for input
// - do action and then return
// functions for actions
// - tweet
// -- input -> tweet
// - delete tweet
// -- delete latest tweet w/ url
// - go live / go offline
// -- stream to GoPro
process.env.NODE_ENV = "production";
var config = require('../../config/index'),
    logger = config.logger;
var Twitter = require('../../modules/twitter');
var util = require('util');
const readline = require('readline');

function connect(callback) {
  var piWifi = require('pi-wifi');
  logger.log('Reconnecting to GoPro...');
  piWifi.restartInterface('wlan0', function (err) {
    if (err) return callback(err);
    piWifi.setCurrentInterface('wlan0', function (err) {
      if (err) return callback(err);
      piWifi.status('wlan0', function (err, status) {
        if (err) return callback(err);
        // logger.log(status);
        logger.log('GoPro connection restarted');
        callback(null);
      });  
    });
  });
}

function tweet(callback) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Text: ', (answer) => {
    logger.log('answer: %s', answer);
    Twitter.tweet(answer, function (err) {
      callback(err);
    });
    rl.close();
  });
}

function tweetLive(callback) {
  Twitter.tweet(null, function (err) {
      callback(err);
  });
}

function deleteTweet(callback) {
  // find recent tweet w/ url
  // delete tweet
  Twitter.deleteLiveTweet(function (err) {
      callback(err);
  });
}

var CONNECTED = false;
var pyshell;

var {PythonShell} = require('python-shell');
var path = require('path');
    
function toggleStream() {
  if (CONNECTED) {
    logger.log('Ending Python process...')
    pyshell.terminate('SIGINT');
  }
  else {
    logger.log('Spawning Python process...');
    var options = {
      'mode': 'text',
      'pythonPath': '/usr/bin/python3',
      'pythonOptions': ['-u'], // get print results in real-time
      'scriptPath': path.join(__dirname,'../GoProStream-master'),
      'args': ['-loglevel', 'debug']
    };
    pyshell = new PythonShell('GoProStream.py', options);
    CONNECTED = true;
    pyshell.on('message', function (message) {
      logger.log(message);
    });

    // end the input stream and allow the process to exit
    pyshell.end(function (err, code, signal) {
      if (err) logger.warn(err);
      logger.log('The exit code was: ' + code);
      logger.log('The exit signal was: ' + signal);
      CONNECTED = false;
    });
  }
  setTimeout((step) => {main()}, 10000);
}

function menu() {
  // show main menu
  logger.log(colorize("[ 0 ] ", 'blue') + "Connect");
  logger.log(colorize("[ 1 ] ", 'blue') + "Tweet");
  logger.log(colorize("[ 2 ] ", 'blue') + "Tweet: Live");
  logger.log(colorize("[ 3 ] ", 'blue') + "Toggle Stream");
  logger.log(colorize("[ 4 ] ", 'blue') + "Delete Tweet");
}

function header() {
  return console.log('\n________                        _______          __\n'+        
    '\\______ \\   ____   ____ ________\\      \\  __ ___/  |_  ______\n' +
    ' |    |  \\_/ __ \\_/ __ \\\\___   //   |   \\|  |  \\   __\\/  ___/\n' +
    ' |    `   \\  ___/\\  ___/ /    //    |    \\  |  /|  |  \\___ \\\n'  +
    '/_______  /\\___  >\\___  >_____ \\____|__  /____/ |__| /____  >\n' +
    '        \\/     \\/     \\/      \\/       \\/                 \\/');
}

var colors = {
  'blue': '\033[94m',
  'header': '\033[48;1;34m',
  'teal': '\033[96m',
  'pink': '\033[95m',
  'green': '\033[92m',
  'yellow': '\033[93m',
  'menu': '\033[48;1;44m'
}

function colorize(string, color) {
  // if not color in colors: return string
  return colors[color] + string + '\033[0m';
}

function main() {
  process.stdout.write('\033c');
  header()
  menu()

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Selection: ', (answer) => {
    rl.close();
    if (answer==0)
      connect(handle);
    else if (answer==1)
      tweet(handle);
    else if (answer==2)
      tweetLive(handle);
    else if (answer==3)
      toggleStream(handle);
    else if (answer==4)
      deleteTweet(handle);
  });
}

main()

function handle(err) {
  if (err) logger.log(err);
  setTimeout((step) => {main()}, 10000);    
}