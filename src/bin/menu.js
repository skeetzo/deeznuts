#!/usr/bin/env node
// menu for interacting with GoPro w/

// process.env.NODE_ENV = "development";
const async = require('async');
const {PythonShell} = require('python-shell');
const readline = require('readline');
const Twitter = require('../modules/twitter');
const util = require('util');
const piWifi = require('pi-wifi');
const { exec } = require("child_process");

var config = require('../config/index');
// const logger = config.logger;
// require('../modules/log').prepare();

var pyshell;
var GOPRO_SSID = "Whorus";
var CONNECTED = false;
var DESTINATION = "shower";
var MODE = "stream"; // stream, local, local-stream
var WIFI = "Disconnected";
var DEBUG = false;

var goProInterface = false;
var streamInterface = false;
  
var args = process.argv.slice(2);
for (var i=0;i<args.length;i++) {
  var val = args[i];
  if (val.indexOf("-debug")>=0) {
    // debug settings
    // DESTINATION = "test"
    MODE = "local";
    DEBUG = true;
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
    else if (answer==4 && CONNECTED)
      toggleStream(function (err) {
        if (err) console.warn(err);
        setTimeout(function () {
          process.exit(1);
        },3000)
      });
    else if (answer==4 && !CONNECTED)
      process.exit(1);
    else {
      console.warn("Warning: Missing selection choice")
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
  console.log(colorize("Select:", 'menu'));
  console.log(colorize("[ 0 ] ", 'blue') + "Connect");
  console.log(colorize("[ 1 ] ", 'blue') + "Options"); 
  console.log(colorize("[ 2 ] ", 'blue') + "Twitter");
  if (!CONNECTED) {
    console.log(colorize("[ 3 ] ", 'blue') + "Stream");
    console.log(colorize("[ 4 ] ", 'pink') + "Quit");
  }
  else {
    console.log(colorize("[ 3 ] ", 'pink') + "End Stream");
    console.log(colorize("[ 4 ] ", 'pink') + "End & Quit");
  }
}

function showSettings() {
  console.log(colorize("Destination", 'blue') +" = " + DESTINATION);
  console.log(colorize("Mode", 'blue') +" = " + MODE);
  console.log(colorize("Tweeting", 'blue') +" = " + config.Twitter_tweeting);
  console.log(colorize("WiFi", 'blue') +" = " + WIFI);
}

function optionsMenu(cb) {  
  console.log(colorize("Set:", 'menu'));
  console.log(colorize("[ 0 ] ", 'blue') + "Back");
  console.log(colorize("[ 1 ] ", 'blue') + "Destination");
  console.log(colorize("[ 2 ] ", 'blue') + "Mode");
  console.log(colorize("[ 3 ] ", 'blue') + "Tweeting");
}

function twitterMenu(cb) {
  console.log(colorize("Set:", 'menu'));
  console.log(colorize("[ 0 ] ", 'blue') + "Back");
  console.log(colorize("[ 1 ] ", 'blue') + "Tweet");
  console.log(colorize("[ 2 ] ", 'blue') + "Tweet: Live");
  if (!CONNECTED)
    console.log(colorize("[ 3 ] ", 'blue') + "Tweet and Toggle");
  console.log(colorize("[ 4 ] ", 'blue') + "Delete Tweet");
}

function handle(err) {
  if (err) console.log(err);
  setTimeout((step) => {main()}, 10000);    
}

//////

function checkWiFi(callback) {
  console.log("Checking WiFi...");
  WIFI = "Disconnected"
  async.series([
    function (step) {
      piWifi.check(GOPRO_SSID, function(err, result) {
        // if (err) return callback(err.message);
        if (err) return callback("Warning: Unable to Connect");
        if (DEBUG)
          console.debug(result);
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
        if (DEBUG)
          console.debug(status);
        if (status.ssid && status.ssid == GOPRO_SSID && status.wpa_state && status.wpa_state == "COMPLETED")
          WIFI = GOPRO_SSID;
        step(null);
      });  
    },
    function (step) {
      console.log(`GoPro WiFi - ${WIFI}`);
      callback(null);
    }
  ]);
}

var retryCount = 0;
function connect(callback) {
  console.log('Reconnecting to GoPro...');
  async.series([
    function (step) {
      return step(null);
      //
      // none of this works because the api call listInterfaces doesn't actually exist
      // but it would go here
      //
      // piWifi.listInterfaces(function (err, interfacesArray) {
      //   if (err) {
      //     console.debug(err.message);
      //     console.warn("Unable to find interfaces");
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
      step(null);
    },
    // function (step) {
    //   console.debug("restarting interfaces");
    //   piWifi.restartInterface(goProInterface, function (err) {
    //     if (err) {
    //       console.debug(err);
    //       if (retryCount<10) {
    //         retryCount++;
    //         return connect(callback);
    //       }
    //       else {
    //         retryCount = 0;
    //         console.warn(err);
    //         return step(null);
    //       }
    //     }
    //     step(null);
    //   });
    // },
    // function (step) {
    //   // doesn't work so running shell command instead to delete wlan0 / GoPro iface
    //   console.debug("setting default interface (not working)")
    //   piWifi.setCurrentInterface(streamInterface, function (err) {
    //     if (err) return callback(err);
    //     step(null);
    //   });
    // },
    // function (step) {
    //   console.log("waiting 10 sec...");
    //   setTimeout(function () {step(null)}, 10000);
    // },
    function (step) {
      console.debug("flushing network: wlan0");
      exec("sudo /sbin/ip addr flush dev wlan0", (error, stdout, stderr) => {
        if (DEBUG) {
          if (error) console.warn(error.message);
          if (stderr) console.debug(stderr);
        }
        // console.log(stdout);
        step(null);
      });
    },
    function (step) {
      console.debug("flushing network: wlan1");
      exec("sudo /sbin/ip addr flush dev wlan1", (error, stdout, stderr) => {
        if (DEBUG) {
          if (error) console.warn(error.message);
          if (stderr) console.debug(stderr);
        }
        // console.log(stdout);
        step(null);
      });
    },
    function (step) {
      if (DEBUG)
        console.debug("waiting 3 sec...");
      setTimeout(function () {step(null)}, 3000);
    },
    function (step) {
      console.debug("bringing down wlan0");
      exec("sudo /sbin/ifdown wlan0 --force", (error, stdout, stderr) => {
        if (DEBUG) {
          if (error) console.warn(error.message);
          if (stderr) console.debug(stderr);
          console.log(stdout);
        }
        step(null);
      });
    },
    function (step) {
      console.debug("bringing up wlan0")
      exec("sudo /sbin/ifup wlan0 --force", (error, stdout, stderr) => {
        if (DEBUG) {
          if (error) console.warn(error.message);
          if (stderr) console.debug(stderr);
          console.log(stdout);
        }
        step(null);
      });
    },
    function (step) {
      console.debug("waiting 3 sec...");
      setTimeout(function () {step(null)}, 3000);
    },
    function (step) {
      console.debug("bringing down wlan1");
      exec("sudo /sbin/ifdown wlan1 --force", (error, stdout, stderr) => {
        if (DEBUG) {
          if (error) console.warn(error.message);
          if (stderr) console.debug(stderr);
          console.log(stdout);
        }
        step(null);
      });
    },
    function (step) {
      console.debug("bringing up wlan1")
      exec("sudo /sbin/ifup wlan1 --force", (error, stdout, stderr) => {
        if (DEBUG) {
          if (error) console.warn(error.message);
          if (stderr) console.debug(stderr);
          console.log(stdout);
        }
        step(null);
      });
    },
    function (step) {
      if (DEBUG)
        console.log("waiting 4 sec...");
      setTimeout(function () {step(null)}, 4000);
    },
    function (step) {
      console.debug("deleting GoPro default route");
      exec("sudo /sbin/ip route del default via 10.5.5.9", (error, stdout, stderr) => {
        if (DEBUG) {
          if (error) console.warn(error.message);
          if (stderr) console.debug(stderr);
          console.log(stdout);
        }
        step(null);
      });
    },
    function (step) {
      console.debug("adding Stream default route");
      exec("sudo /sbin/ip route add default via 192.168.1.69", (error, stdout, stderr) => {
        if (DEBUG) {
          if (error) console.debug(`error: ${error.message}`);
          if (stderr) console.debug(`stderr: ${stderr}`);
          if (stdout) console.debug(`stdout: ${stdout}`);
        }
        step(null);
      });
    },
    // function (step) {
    //   console.log("waiting 5 sec...");
    //   setTimeout(function () {step(null)}, 5000);
    // },
    // function (step) {
    //   console.log("flushing iptables");
    //   exec("sudo /sbin/iptables -F", (error, stdout, stderr) => {
    //     if (error) {
    //       console.log(`error: ${error.message}`);
    //     }
    //     if (stderr) {
    //       console.log(`stderr: ${stderr}`);
    //     }
    //     console.log(stdout);
    //     step(null);
    //   });
    // },
    // function (step) {
    //   console.log("preparing iptables");
    //   exec("sudo /sbin/iptables -A PREROUTING -i wlan0 -p udp -m udp --dport 8554 -j DNAT --to-destination 192.168.1.13:8554", (error, stdout, stderr) => {
    //     if (error) {
    //       console.log(`error: ${error.message}`);
    //     }
    //     if (stderr) {
    //       console.log(`stderr: ${stderr}`);
    //     }
    //     console.log(stdout);
    //     step(null);
    //   });
    // },
    // function (step) {
    //   console.log("restoring iptables");
    //   exec("sudo /sbin/iptables-restore", (error, stdout, stderr) => {
    //     if (error) {
    //       console.log(`error: ${error.message}`);
    //     }
    //     if (stderr) {
    //       console.log(`stderr: ${stderr}`);
    //     }
    //     console.log(stdout);
    //     step(null);
    //   });
    // },
    function (step) {
      console.log();
      exec("/sbin/ip route", (error, stdout, stderr) => {
        if (DEBUG) {
          if (error) console.warn(error.message);
          if (stderr) console.debug(stderr);
          console.log(`Routes:\n${stdout}`);
        }
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
      console.log('Connection Successful');
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

// sets mode to: local, stream
function setMode(callback) {
  // default 'stream'
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('mode [local|stream]: ', (answer) => {
    if (answer!="stream"&&answer!="local") 
      console.log("Error: please enter a correct setting");
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
      console.log("Error: please enter a correct setting");
    else
      ARGS[setting] = answer;
    console.log("setting: %s -> %s", answer, ARGS[setting]);
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
    console.log('answer: %s', answer);
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
    console.log('Ending Python process...')
    pyshell.send("q")
    // end the input stream and allow the process to exit
    pyshell.end(function (err, code, signal) {
      if (err) console.warn(err);
      console.log('The exit code was: ' + code);
      console.log('The exit signal was: ' + signal);
    });
    pyshell.terminate('SIGINT');
    CONNECTED = false;
  }
  else {
    var loglevel = "quiet";
    if (DEBUG) {
      loglevel = "debug";
      MODE = "debug";
    }
    console.log('Spawning Python process...');
    var options = {
      'mode': 'text',
      'pythonPath': '/usr/bin/python3',
      'pythonOptions': ['-u'], // get print results in real-time
      'scriptPath': require('path').join(__dirname,'../modules/GoPro'),
      'args': ['-loglevel',loglevel, '-destination', DESTINATION, '-mode', MODE]
    }; 
    pyshell = new PythonShell('GoProStream.py', options);
    CONNECTED = true;
    pyshell.on('message', function (message) {
      console.log(message);
    });
  }
  cb(null);
}

////////////////////////////////////////////////////////////////////////////////////

checkWiFi(function (err) {
  if (err) console.warn(err);
  main();
});