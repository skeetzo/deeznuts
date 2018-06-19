var _ = require('underscore'),
    async = require('async'),
    config = require('../config/index'),
    logger = config.logger,
    CronJob = require('cron').CronJob;

var crons = function() {
    var self = this;

    this.debugging = [];
}

crons.prototype = {
    start : function () {
        var self = this;
        if (!config.Crons_On) {
            return logger.debug('Skipping Crons');
        }
        logger.log('Starting Crons');

        var jobs = [];

        function makePretty(functionName) {
            return functionName.charAt(0).toUpperCase()+functionName.substring(1).replace(/[A-Z]/g, function(letter, index) {
                return ' '+letter;
            });
        }

        var keys = _.keys(config.crons);
        var Crons = new crons();

        _.forEach(keys,function(key) {
            var cro = config.crons[key];
            var cron = new CronJob({
                cronTime: cro.cronTime,
                onTick: function() {
                    if (Crons[key] && typeof Crons[key] == 'function') 
                        Crons[key](function (err) {
                            if (err) logger.warn(err);
                        });
                    else
                        logger.warn('cron failed: %s',key);
                },
                start: cro.start,
                timeZone: cro.timeZone
            });
            cron.label = makePretty(key);
            cron.started = cro.start;
            jobs.push(cron);
        });
        
        // Prints out the started cronjobs
        _.forEach(jobs, function(job) {
            if (job.started) logger.log('started cron - %s',job.label);
        });
        
    },

    ping: function(callback) {
        logger.log('-- Ping -- ');
        callback(null);
    },

    // next day
    midnight : function(callback) {
        logger.log('--- Midnight ---');
        async.series([
            function (step) {
                var Log = require('../mods/log');
                Log.reset(function (err) {
                    if (err) logger.log(err);
                    step(null);
                });
            },
            function (step) {
                logger.log('--- Midnight ---');
                callback(null);      
            },
        ]);
    }
}

var Crons = new crons();

module.exports = Crons;