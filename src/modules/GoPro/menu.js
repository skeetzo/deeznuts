// Skeetzo
// 2/12/2019
// 7/18/2019 

// process.env.NODE_ENV = "development";

var config = require('../../config/index');
const logger = config.logger;
const readline = require('readline');
const Twitter = require('../../modules/twitter');
const util = require('util');

var CONNECTED = false;
var destination = "shower";
var mode = "remote";
var pyshell;

function connect(callback) {
  var piWifi = require('pi-wifi');
  logger.log('Reconnecting to GoPro...');
  piWifi.restartInterface('wlan0', function (err) {
    if (err) return callback(err);
    piWifi.setCurrentInterface('eth0', function (err) {
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

// sets destination to: shower, 
function setDestination(callback) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  // default 'shower'
  rl.question('destination (shower, ) ', (answer) => {
    destination = answer.toString();
    rl.close();
    callback(null);
  });
}

// sets mode to: local, remote, custom
function setMode(callback) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  // default 'remote'
  rl.question('mode (remote or local): ', (answer) => {
    if (answer!="remote"&&answer!="local") 
      logger.log("Error: please enter a correct setting");
    else
      mode = answer;
    rl.close();
    callback(null);
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

function tweetAndToggle(callback) {
  tweet(function (err) {
    if (err) return callback(err);
    setTimeout(function () {
      toggleStream();
    }, 3000);
  });
}

function tweetLiveAndToggle(callback) {
  tweetLive(function (err) {
    if (err) return callback(err);
    setTimeout(function () {
      toggleStream();
    }, 3000);
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
    
function toggleStream() {
  if (CONNECTED) {
    logger.log('Ending Python process...')
    pyshell.send("q")
    // end the input stream and allow the process to exit
    pyshell.end(function (err, code, signal) {
      if (err) logger.warn(err);
      logger.log('The exit code was: ' + code);
      logger.log('The exit signal was: ' + signal);
    });
    pyshell.terminate('SIGINT');
    CONNECTED = false;
  }
  else {
    logger.log('Spawning Python process...');
    var options = {
      'mode': 'text',
      'pythonPath': '/usr/bin/python3',
      'pythonOptions': ['-u'], // get print results in real-time
      'scriptPath': require('path').join(__dirname,'../GoPro'),
      'args': ['-loglevel', 'debug', '-destination', destination, '-mode', mode]
    };
    const {PythonShell} = require('python-shell');
    pyshell = new PythonShell('GoProStream.py', options);
    CONNECTED = true;
    pyshell.on('message', function (message) {
      logger.log(message);
    });
  }
  setTimeout((step) => {main()}, 10000);
}

function menu() {
  // show main menu
  logger.log(colorize("[ 0 ] ", 'blue') + "Connect");
  logger.log(colorize("[ 1 ] ", 'blue') + "Set Destination");
  logger.log(colorize("[ 2 ] ", 'blue') + "Set Mode");
  logger.log(colorize("[ 3 ] ", 'blue') + "Tweet");
  logger.log(colorize("[ 4 ] ", 'blue') + "Tweet: Live");
  logger.log(colorize("[ 5 ] ", 'blue') + "Toggle Stream");
  logger.log(colorize("[ 6 ] ", 'blue') + "Tweet and Toggle");
  logger.log(colorize("[ 7 ] ", 'blue') + "Tweet Live and Toggle");
  logger.log(colorize("[ 8 ] ", 'blue') + "Delete Tweet");
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
      setDestination(handle);
    else if (answer==2)
      setMode(handle);
    else if (answer==3)
      tweet(handle);
    else if (answer==4)
      tweetLive(handle);
    else if (answer==5)
      toggleStream(handle);
    else if (answer==6)
      tweetAndToggle(handle);
    else if (answer==7)
      tweetLiveAndToggle(handle);
    else if (answer==8)
      deleteTweet(handle);
  });
}

main()

function handle(err) {
  if (err) logger.log(err);
  setTimeout((step) => {main()}, 10000);    
}
