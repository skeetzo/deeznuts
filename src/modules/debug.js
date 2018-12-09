var config = require('../config/index'),
    logger = config.logger,
    moment = require('moment'),
    path = require('path'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    _ = require('underscore'),
    async = require('async'),
    fs = require('fs'),
    fss = require('fs-extra');

module.exports.debug = function(callback) {
    logger.test('Debugging');
    async.waterfall([

        function resetLogs(cb) {
            if (!config.debugging_reset_logs) return cb(null);
            logger.test('Resetting Logs');
            var Log = require('../modules/log');
            Log.reset(function (err) {
                if (err) logger.warn(err);
                cb(null);
            });
        },

        function backupDatabase(cb) {
            if (!config.debugging_backup_db) return cb(null);
            require('../modules/backup').backup(function (err) {
                if (err) logger.warn(err);
                cb(null);
            });
        },

        function backupVideos(cb) {
            if (!config.backupToOnlyFans) return cb(null);
            require('../models/video').find({}, function (err, videos) {
                if (err) {
                    logger.warn(err);
                    cb(null);
                }
                var series = [];
                _.forEach(videos, function (video) {
                    series.push(function (step) {
                        video.backup(function (err) {
                            if (err) logger.warn(err);
                            step(null);
                        });
                    });
                });
                series.push(function (step) {
                    cb(null);
                });
                async.series(series);
            });
        },

        function resetDatabase(cb) {
            if (!config.debugging_reset_db) return cb(null);
            logger.test('Resetting Database:');
            async.series([
                // function (step) {
                //     mongoose.connection.db.dropDatabase(function(err, result) {
                //         if (err) logger.warn(err);
                //         step(null);
                //     });
                // },
                function (step) {
                    mongoose.connection.db.dropCollection('sessions', function(err) {
                        if (err) logger.warn(err);
                        logger.test('- session');
                        step(null);
                    });
                },
                function (step) {
                    mongoose.connection.db.dropCollection('users', function (err) {
                        if (err) logger.warn(err);
                        logger.test('- user');
                        step(null);
                    });
                },
                function (step) {
                    mongoose.connection.db.dropCollection('videos', function (err) {
                        if (err) logger.warn(err);
                        logger.test('- video');
                        step(null);
                    });
                },
                function (step) {
                    mongoose.connection.db.dropCollection('transactions', function (err) {
                        if (err) logger.warn(err);
                        logger.test('- transaction');
                        step(null);
                    });
                },
                function (step) {
                    if (!config.debugging_reset_files) return step(null);
                    fss.emptyDir(path.join(config.videosPath, 'archived/stream'), function (err) {
                        if (err) logger.warn(err);
                        logger.test('- archived');
                        step(null);
                    });
                },
                function (step) {
                    if (!config.debugging_reset_files) return step(null);
                    fss.emptyDir(path.join(config.videosPath, 'live/stream'), function (err) {
                        if (err) logger.warn(err);
                        logger.test('- live');
                        step(null);
                    });
                },
                function (step) {
                    if (!config.debugging_reset_files) return step(null);
                    fss.emptyDir(path.join(config.videosPath, 'previews'), function (err) {
                        if (err) logger.warn(err);
                        logger.test('- previews');
                        step(null);
                    });
                },
                function (step) {
                    if (!config.debugging_reset_files) return step(null);
                    fss.emptyDir(path.join(config.imagesPath, 'thumbnails'), function (err) {
                        if (err) logger.warn(err);
                        logger.test('- thumbnails');
                        step(null);
                    });
                },
                function (step) {
                    if (config.debugging_db_only) return cb('Debugging DB Only');
                    cb(null);
                },
            ]);
        },

        function defaultUser(cb) {
            var User = require('../models/user');
            User.findOne({'username':config.deeznutsUser.username}, function (err, user) {
                if (err) {
                    logger.warn(err);
                    cb(null);
                }
                if (!user) {
                    logger.test('- new default user')
                    user = new User(config.defaultUser);
                    user.save(function (err) {
                        if (err) logger.warn(err);
                        cb(null);
                    });
                }
                else cb(null);
            });
        },

        // Email Tests
        function testEmails(cb) {
            if (!config.emailing_testing) {
                logger.test('Skipping Email Tests');
                return cb(null);
            }
            var Gmail = require('../modules/gmail');
            var tests = config.email_tests || [],
                series = [];
            logger.test('Testing Emails: %s', tests.length);
            _.forEach(tests, function (email) {
                series.push(function (next) {
                    if (typeof config[email.function] != "function") return logger.log('Not found: %s',email.function);
                    var mailOptions = config[email.function](config.email_test_address, email.data);
                    logger.test('Testing Email: %s', email.function);
                    Gmail.sendEmail(mailOptions, function (err) {
                        if (err) logger.warn(err);      
                        next(null);
                    });
                });
            });
            series.push(function (next) {
                logger.test('Email Tests Complete');
                cb(null);
            });
            async.series(series);
        },

        function testCrons(cb) {
            if (!config.debugging_crons) {
                logger.test('Skipping Crons Tests');
                return cb(null);
            }
            logger.test('Testing Crons');
            var Crons = require('../modules/cron');
            var series = [];
            _.forEach(Crons.debugging, function (c) {
                if (typeof Crons[c] === 'function') 
                    series.push(function (step) {
                        logger.test('cron: %s',c);
                        Crons[c](function (err) {
                            setTimeout(() => { step(null); });
                        });
                    });
            });
            series.push(function (step) {
                logger.test('Cron Tests Complete');
                cb(null);
            });
            async.series(series);
        },

        function (cb) {
            logger.test('Debugging Complete')
            cb(null);
        }
        ], function (err) {
            callback(err);
        }
    );
}

