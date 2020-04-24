#!/usr/bin/env node
// menu for interacting with GoPro w/

// Skeetzo
// 2/12/2019
// 7/18/2019 
// 9/12/2019
// 2/12/2020
// 4/21/2020

// todo:
// need to figure out a way to have args from here -> deeznuts running process

// process.env.NODE_ENV = "development";
const async = require('async');
const {PythonShell} = require('python-shell');
const readline = require('readline');
const Twitter = require('../modules/twitter');
const util = require('util');
const piWifi = require('pi-wifi');
const { exec } = require("child_process");

var config = require('../config/index');
const logger = config.logger;
require('../modules/log').prepare();

var pyshell;
var GOPRO_SSID = "Whorus";
var CONNECTED = false;
var DESTINATION = "shower";
var MODE = "remote"; // remote, local, remote-local
var WIFI = "Disconnected";

var goProInterface = false;
var streamInterface = false;
  
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
  // process.stdout.write('\033c');
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
    else if (answer==4)
      toggleStream(function (err) {
        if (err) logger.warn(err);
        setTimeout(function () {
          process.exit(1);
        },3000)
      });
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
      setDestination(handle);
    else if (answer==2)
      setMode(handle);
    else if (answer==3)
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
  else {
    logger.log(colorize("[ 3 ] ", 'pink') + "End Stream");
    logger.log(colorize("[ 4 ] ", 'pink') + "End & Quit");
  }
}

function showSettings() {
  console.log(colorize("Destination", 'blue') +" = " + DESTINATION);
  console.log(colorize("Mode", 'blue') +" = " + MODE);
  console.log(colorize("Tweeting", 'blue') +" = " + config.Twitter_tweeting);
  console.log(colorize("WiFi", 'blue') +" = " + WIFI);
}

function optionsMenu(cb) {  
  logger.log(colorize("Set:", 'menu'));
  logger.log(colorize("[ 0 ] ", 'blue') + "Back");
  logger.log(colorize("[ 1 ] ", 'blue') + "Destination");
  logger.log(colorize("[ 2 ] ", 'blue') + "Mode");
  logger.log(colorize("[ 3 ] ", 'blue') + "Tweeting");
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

//////

function checkWiFi(callback) {
  logger.log("Checking WiFi...");
  WIFI = "Disconnected"
  async.series([
    function (step) {
      piWifi.check(GOPRO_SSID, function(err, result) {
        if (err) return callback(err.message);
        logger.debug(result);
        if (result&&result.selected) 
          WIFI = GOPRO_SSID;
        else
          WIFI = "Disconnected";
        step(null);
      });
    },
    function (step) {
      piWifi.status(goProInterface, function (err, status) {
        if (err) return callback(err);
        logger.debug(status);
        if (status.ssid && status.ssid == GOPRO_SSID && status.wpa_state && status.wpa_state == "COMPLETED")
          WIFI = GOPRO_SSID;
        step(null);
      });  
    },
    function (step) {
      logger.log(`GoPro WiFi - ${WIFI}`);
      callback(null);
    }
  ]);
}

var retryCount = 0;
function connect(callback) {
  logger.log('Reconnecting to GoPro...');
  async.series([
    function (step) {
      return step(null);
      //
      // none of this works because the api call listInterfaces doesn't actually exist
      // but it would go here
      //
      // piWifi.listInterfaces(function (err, interfacesArray) {
      //   if (err) {
      //     logger.debug(err.message);
      //     logger.warn("Unable to find interfaces");
      //     return callback(null)
      //   }
      //   console.log(interfacesArray); // ['eth0','wlan0','wlan1']
      //   var eth0 = false,
      //       eth1 = false,
      //       wlan0 = false,
      //       wlan1 = false,
      //       wlan2 = false;
      //   for (var i=0;i<interfacesArray.length;i++) {
      //     iface = interfacesArray[i];
      //     if (iface == "eth0") eth0 = true;
      //     else if (iface == "eth1") eth1 = true;
      //     else if (iface == "wlan0") wlan0 = true;
      //     else if (iface == "wlan1") wlan1 = true;
      //     else if (iface == "wlan2") wlan2 = true;
      //   }

      //   /* preferance conditions:
      //    0) eth + eth
      //    1) eth + wifi
      //    2) wifi + wifi
      //    3) wifi -> save local
      //   */
      //   var interfaces = null;
      //   if (eth0&&eth1) interfaces = [eth0, eth1];
      //   else if (eth0&&wlan0) interfaces = [wlan0, eth0];
      //   else if (eth0&&wlan1) interfaces = [wlan1, eth0];
      //   else if (eth0&&wlan2) interfaces = [wlan2, eth0];
      //   else if (eth1&&wlan0) interfaces = [wlan0, eth1];
      //   else if (eth1&&wlan1) interfaces = [wlan1, eth1];
      //   else if (eth1&&wlan2) interfaces = [wlan2, eth1];
      //   else if (wlan0&&wlan1) interfaces = [wlan1, wlan0];
      //   else if (wlan0) interfaces = [wlan0];
      //   else if (wlan1) interfaces = [wlan1];
      //   else return callback("Error: Missing Network Interface")
      //   if (!interfaces) return callback("Error: Missing Network Interface")
      //   goProInterface = interfaces[0]
      //   if (interfaces.length==2) streamInterface = interfaces[1];
      //   else streamInterface = interfaces[0];
      //   step(null);
      // });
    },
    function (step) {
      if (!goProInterface) goProInterface = "wlan0";
      if (!streamInterface) streamInterface = "wlan1";
      logger.debug("restarting interfaces");
      piWifi.restartInterface(goProInterface, function (err) {
        if (err) {
          if (retryCount<3) {
            retryCount++;
            return connect(callback);
          }
          else {
            retryCount = 0;
            return callback(err);
          }
        }
        step(null);
      });
    },
    function (step) {
      // doesn't work so running shell command instead to delete wlan0 / GoPro iface
      logger.debug("setting default route")
      piWifi.setCurrentInterface(streamInterface, function (err) {
        if (err) return callback(err);
        step(null);
      });
    },
    function (step) {
      logger.log("waiting 3 sec...");
      setTimeout(function () {step(null)}, 3000);
    },
    function (step) {
      logger.debug("deleting GoPro default route")
      // exec("sudo /sbin/route del default wlan0", () => {
      exec("sudo /sbin/ip addr flush dev wlan1", (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        // console.log(`stdout: ${stdout}`);
        exec("sudo /sbin/ip route add default via 192.168.1.1", (error, stdout, stderr) => {
          if (error) {
              console.log(`error: ${error.message}`);
              return;
          }
          if (stderr) {
              console.log(`stderr: ${stderr}`);
              return;
          }
          console.log(`stdout: ${stdout}`);
          exec("sudo /sbin/ip route del default via 10.5.5.9", (error, stdout, stderr) => {
            if (error) {
                console.log(`error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.log(`stderr: ${stderr}`);
                return;
            }
            console.log(`stdout: ${stdout}`);
            step(null);
          });
        });
      });
    },
    function (step) {
      logger.log("Routes:");
      exec("/sbin/ip route", (error, stdout, stderr) => {
        if (error) {
          console.log(`error: ${error.message}`);
          return;
        }
        if (stderr) {
          console.log(`stderr: ${stderr}`);
          return;
        }
        console.log(stdout);
        step(null);
      });
    },
    function (step) {
      checkWiFi(function (err) {
        if (err) return callback(err);
        step(null);
      });
    },
    function (step) {
      logger.log('GoPro Connection Restarted');
      callback(null);
    }
  ]);
}

//////

// sets destination to: shower, 
function setDestination(callback) {
  // default 'shower'
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('destination [shower, ] ', (answer) => {
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
  rl.question('mode [remote|local|remote-local]: ', (answer) => {
    if (answer!="remote"&&answer!="local") 
      logger.log("Error: please enter a correct setting");
    else
      MODE = answer;
    rl.close();
    callback(null);
  });
}

//////

function trueFalse(setting, callback) {
  // default 'remote'
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question(setting+' [true|false]: ', (answer) => {
    if (answer.toLowerCase()!="true"&&answer.toLowerCase()!="false") 
      logger.log("Error: please enter a correct setting");
    else
      ARGS[setting] = answer;
    logger.log("setting: %s -> %s", answer, ARGS[setting]);
    rl.close();
    callback(null);
  });
}

//////

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

//////
    
function toggleStream(cb) {
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
    pyshell = new PythonShell('GoProStream.py', options);
    CONNECTED = true;
    pyshell.on('message', function (message) {
      logger.log(message);
    });
  }
  cb(null);
}

////////////////////////////////////////////////////////////////////////////////////

checkWiFi(function (err) {
  if (err) logger.warn(err);
  main();
});