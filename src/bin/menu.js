// Skeetzo
// 2/12/2019
// 7/18/2019 
// 9/12/2019

// need to figure out a way to have args from here -> deeznuts running process

// process.env.NODE_ENV = "development";

var config = require('../config/index');
const logger = config.logger;
const readline = require('readline');
const Twitter = require('../modules/twitter');
const util = require('util');

var CONNECTED = false;
var DESTINATION = "shower";
var MODE = "remote";
var pyshell;
var ARGS = {
  archive:false,
  backup:false,
  delete:false,
  live:false,
  tweeting:false
};

var args = process.argv.slice(2);
for (var i=0;i<args.length;i++) {
  var val = args[i];
  if (val.indexOf("-debug")>=0) {
    // debug settings
    // DESTINATION = "test"
    MODE = "local";
  }
  else if (val.indexOf("-destination")>=0)
    DESTINATION = args[i+1]
  else if (val.indexOf("-mode")>=0) 
    MODE = args[i+1]
}
// });

var colors = {
  'blue': '\033[94m',
  'header': '\033[1;37;40m',
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

function header() {
  process.stdout.write('\033c');
  return console.log(colorize('\n________                        _______          __\n'+        
    '\\______ \\   ____   ____ ________\\      \\  __ ___/  |_  ______\n' +
    ' |    |  \\_/ __ \\_/ __ \\\\___   //   |   \\|  |  \\   __\\/  ___/\n' +
    ' |    `   \\  ___/\\  ___/ /    //    |    \\  |  /|  |  \\___ \\\n'  +
    '/_______  /\\___  >\\___  >_____ \\____|__  /____/ |__| /____  >\n' +
    '        \\/     \\/     \\/      \\/       \\/                 \\/', 'header'));
}

function main() {
  header()
  showSettings()
  menu()
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Selection: ', (answer) => {
    rl.close();
    // 0 is connect
    if (answer==0)
      connect(handle);
    // 1 is options
    else if (answer==1)
      settings();
    // 2 is twitter
    else if (answer==2)
      twitter();
    // 3 is stream
    else if (answer==3)
      toggleStream(handle);
    else {
      logger.warn("Warning: Missing selection choice")
      return main();
    }
  });
}

function settings() {
  header()
  optionsMenu()
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Selection: ', (answer) => {
    rl.close();
    if (answer==0)
      return main();
    else if (answer==1)
      trueFalse("archive", handle);
    else if (answer==2)
      trueFalse("backup", handle);
    else if (answer==3)
      trueFalse("delete", handle);
    else if (answer==4)
      setDestination(handle);
    else if (answer==5)
      trueFalse("live", handle);
    else if (answer==6)
      setMode(handle);
    else if (answer==5)
      trueFalse("tweeting", handle);
    else
      return main();
  });
}

function twitter() {
  header()
  twitterMenu()
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Selection: ', (answer) => {
    rl.close();
    if (answer==0)
      return main();
    else if (answer==1)
      tweet(handle)
    else if (answer==2)
      tweetLive(handle)
    else if (answer==3)
      tweetAndToggle(handle)
    else if (answer==4)
      deleteTweet(handle)
    else
      return main();
  });
}

function menu() {
  // show main menu
  logger.log(colorize("Select:", 'menu'));
  logger.log(colorize("[ 0 ] ", 'blue') + "Connect");
  logger.log(colorize("[ 1 ] ", 'blue') + "Options"); 
  logger.log(colorize("[ 2 ] ", 'blue') + "Twitter");
  if (!CONNECTED)
    logger.log(colorize("[ 3 ] ", 'blue') + "Stream");
  else
    logger.log(colorize("[ 3 ] ", 'pink') + "End Stream");
}

function showSettings() {
  console.log(colorize("Archive", 'blue') +" = " + ARGS.archive);
  console.log(colorize("Backup", 'blue') +" = " + ARGS.backup);
  console.log(colorize("Delete", 'blue') +" = " + ARGS.delete);
  console.log(colorize("Destination", 'blue') +" = " + DESTINATION);
  console.log(colorize("Live", 'blue') +" = " + ARGS.live);
  console.log(colorize("Mode", 'blue') +" = " + MODE);
  console.log(colorize("Tweeting", 'blue') +" = " + ARGS.tweeting);
}

function optionsMenu(cb) {  
  logger.log(colorize("Set:", 'menu'));
  logger.log(colorize("[ 0 ] ", 'blue') + "Back");
  logger.log(colorize("[ 1 ] ", 'blue') + "Archive On Publish");
  logger.log(colorize("[ 2 ] ", 'blue') + "Backup To OnlyFans");
  logger.log(colorize("[ 3 ] ", 'blue') + "Delete On Publish");
  logger.log(colorize("[ 4 ] ", 'blue') + "Destination");
  logger.log(colorize("[ 5 ] ", 'blue') + "Live");
  logger.log(colorize("[ 6 ] ", 'blue') + "Mode");
  logger.log(colorize("[ 7 ] ", 'blue') + "Tweeting");
}

function twitterMenu(cb) {
  logger.log(colorize("Set:", 'menu'));
  logger.log(colorize("[ 0 ] ", 'blue') + "Back");
  logger.log(colorize("[ 1 ] ", 'blue') + "Tweet");
  logger.log(colorize("[ 2 ] ", 'blue') + "Tweet: Live");
  if (!CONNECTED)
    logger.log(colorize("[ 3 ] ", 'blue') + "Tweet and Toggle");
  logger.log(colorize("[ 4 ] ", 'blue') + "Delete Tweet");
}

function handle(err) {
  if (err) logger.log(err);
  setTimeout((step) => {main()}, 10000);    
}

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
  // default 'shower'
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('destination (shower, ) ', (answer) => {
    DESTINATION = answer.toString();
    rl.close();
    callback(null);
  });
}

// sets mode to: local, remote, custom
function setMode(callback) {
  // default 'remote'
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('mode (remote or local): ', (answer) => {
    if (answer!="remote"&&answer!="local") 
      logger.log("Error: please enter a correct setting");
    else
      MODE = answer;
    rl.close();
    callback(null);
  });
}

function trueFalse(setting, callback) {
  // default 'remote'
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question(setting+' (true or false): ', (answer) => {
    if (answer.toLowerCase()!="true"&&answer.toLowerCase()!="false") 
      logger.log("Error: please enter a correct setting");
    else
      ARGS[setting] = answer;
    logger.log("setting: %s -> %s", answer, ARGS[setting]);
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
      'scriptPath': require('path').join(__dirname,'../modules/GoPro'),
      'args': ['-loglevel', 'debug', '-destination', DESTINATION, '-mode', MODE]
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

main()