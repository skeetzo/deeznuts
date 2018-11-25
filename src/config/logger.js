var fs = require('fs'),
    colors = require('colors/safe'),
    _ = require('underscore'),
    moment = require('moment');

module.exports = function() {
	var self = this;

	self.logger = require('tracer').colorConsole(
        {	
        	methods : ['log','debug','warn','error','load','test','save','remove','bank','io'],
            format : [
                  colors.white("{{timestamp}} ")+colors.yellow(self.botName)+": {{message}}",
                  {
                      error : colors.white("{{timestamp}} ")+" <{{title}}> {{message}} (in {{file}}:({{method}}):{{line}})\nCall Stack:\n{{stack}}",
                      warn : colors.white("{{timestamp}} ")+" {{message}}",
                      debug : colors.white("{{timestamp}} ")+colors.yellow(self.botName)+": {{message}}",
                      test : colors.white("{{timestamp}} ")+colors.bgRed(self.botName)+": "+colors.white("{{message}}"),
                      save : colors.white("{{timestamp}} ")+colors.green(self.botName)+": "+colors.white("{{message}}"),
                      remove : colors.white("{{timestamp}} ")+colors.red(self.botName)+": "+colors.white("{{message}}"),
                      bank : colors.white("{{timestamp}} ")+colors.blue(self.botName)+": "+colors.white("{{message}}"),
                      io : colors.white("{{timestamp}} ")+colors.blue(self.botName)+": "+colors.white("{{message}}")                  
                  }
            ],
            filters : {
	            trace : colors.magenta,
	            debug : colors.blue,
	            info : colors.green,
	            warn : [ colors.yellow, colors.bold ],
	            error : [ colors.red, colors.bold ],
	            test : colors.yellow,
              io : colors.bold
	        },
	        level : 'log',
          dateformat : "HH:MM:ss.L",
          preprocess :  function(data) {
            data.timestamp = moment(new Date()).format('MM/DD/YYYY-')+data.timestamp;
            data.title = data.title.toLowerCase();
          },
          transport : [
            function (data) {
            	// Console
              console.log(data.output);
            },
            function (data) {
              // Static
              fs.appendFileSync(self.logs_file, data.output + '\n');
            }
          ]
        });
}