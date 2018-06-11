var _ = require('underscore'),
    config = require('../config/index'),
    moment = require('moment'),
    logger = config.logger,
    async = require('async'),
    Money = require('es-money'),
    path = require('path');
    

// Check Login
module.exports.loggedIn = function(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        req.flash('error','Please login!');
        res.status(401).render('index',req.session.locals);
    }
}

// Check Login
module.exports.loggedInKairos = function(req, res, next) {
    if (req.session.user&&req.session.user.username==config.Kairos.username) {
        next();
    } else {
        logger.log('Log in, moron');
        req.flash('error','Please login!');
        res.status(401).redirect('/');
    }
}

// Reset Locals
module.exports.resetLocals = function(req, res, next) {
	// App Locals
	if (!req.session.locals) {
    	// logger.debug('resetting session locals');
    	req.session.locals = {};
    	_.forEach(_.keys(req.app.locals), function(setting) {
		    req.session.locals[setting] = req.app.locals[setting];
		});
    }
   	// Local Settings
    // this can be cut out or set to only run once
    _.forEach(_.keys(config.pageData), function(setting) {
	    if (!req.session.locals[setting])
		    req.session.locals[setting] = config.pageData[setting];
	});

    if (req.session.user) req.session.locals.user = User(req.session.user);

    // Flash Messages
    if (!req.session.flashSkip) req.session.flashSkip = -1;
    // else logger.log('flashSkip: %s', req.session.flashSkip);
    // Flash check from Passport Logins
    if (req.session.flashSkip>=0)
        req.session.flashSkip--;
    else {
        var tmp = req.flash('message');
        if (tmp.length>0) req.session.locals.message = tmp;
        else req.session.locals.message = null;
        tmp = req.flash('error');
        if (tmp.length>0) req.session.locals.error = tmp;
        else req.session.locals.error = null;
        // logger.debug('message: %s',req.session.locals.message);
        // logger.debug('error: %s',req.session.locals.error);
    }

    if (!req.session.locals._csrf)
        req.session.locals._csrf = req.csrfToken();
    req.session.save(function (err) {
        if (err) logger.warn(err);
        // logger.debug('locals updated');
        next(null);
    });
}

var User = function(src) {
    var user = {
        _id: src._id,
        kind: src.kind,
        name: src.name,
        username: src.username,
        gender: src.gender,
        snapchat: src.snapchat,
        price: src.price,
        bio: src.bio,
        email: src.email,
        billing: src.billing,
        subscriptions: src.subscriptions,
        payouts: src.payouts,
        pendingBalance: src.pending_balance,
        availableBalance: src.available_balance,
        payoutSchedule: src.payout_schedule,
        deactivated: src.deactivated,
    }
    if (src.available_balance&&src.pending_payout) {
        var available_balance = new Money('USD', src.available_balance),
            pending_payout = new Money('USD', src.pending_payout);
        if (available_balance.amount<pending_payout.amount)
            logger.log('Not enough available funds! %s < %s',available_balance.amount,pending_payout.amount);
        else {
            try {
                user.availableBalance = available_balance.subtract(pending_payout).amount;
            }
            catch (err) {
                logger.warn('Subtraction error! Adjusting balance 1 cent for math');
                available_balance = available_balance.add(new Money('USD', '0.01'));
                user.availableBalance = available_balance.subtract(pending_payout);
                user.availableBalance = user.availableBalance.subtract(new Money('USD', '0.01')).amount;
            }
        }
    }
    var birthday = moment(src.birthday);
    user.birthdayMonth = birthday.get('month');
    user.birthdayDay = birthday.get('date');
    user.birthdayYear = birthday.get('year');

    if (src.twitter&&src.twitter.username) {
        user.twitter = src.twitter.username;
        user.banner = src.twitter.bannerImage;
        user.image = src.twitter.profileImage;
    }
    else if (src.twitter) {
        user.twitter = src.twitter;
        user.banner = src.banner;
        user.image = src.image;
    }
    if (src.twitter&&src.twitter.tweetNew)
        user.tweetNew = src.twitter.tweetNew;
    else if (src.tweetNew)
        user.tweetNew = src.tweetNew;
    else
        user.tweetNew = false;
    if (src.twitter&&src.twitter.tweetWeekly)
        user.tweetWeekly = src.twitter.tweetWeekly;
    else if (src.tweetWeekly)
        user.tweetWeekly = src.tweetWeekly;
    else
        user.tweetWeekly = false;

    user.tweet_new_account = config.twitter_new_account(user),
    user.tweet_new_content = config.twitter_new_content(user),
    user.tweet_new_subscriber = config.twitter_new_subscriber(user),
    user.tweet_weekly_reminder = config.twitter_weekly_reminder(user);

    if (src.image) {
        user.image = path.join('/assets/tmp/images', src.image);
        user.imageName = src.imageName;
    }
    if (src.banner) {
        user.banner = path.join('/assets/tmp/images', src.banner);
        user.bannerName = src.bannerName;
    }
    if (src.instagram&&src.instagram.username&&src.instagram.username.length>0)
        user.instagram = src.instagram.username;
    else if (src.instagram)
        user.instagram = src.instagram;
    if (typeof user.instagram != String)
        user.instagram = '';
    return user;
}
module.exports.User = User;

var User_Account = function(src, callback) {
    var Subscription = require('../models/subscription'),
        Payout = require('../models/payout'),
        User_ = require('../models/user');
    var user = User(src);
    async.series([
        // Update Subscriptions
        function (step) {
            if (!user.subscriptions||user.subscriptions.length==0) return step(null);
            Subscription.find({'_id': { '$in': user.subscriptions }}, function (err, subscriptions) {
                if (err) logger.warn(err);
                user.subscriptions = Subscriptions(user.kind, subscriptions);
                step(null);
            });
        },
        function (step) {
            if (!user.subscriptions||user.subscriptions.length==0) return step(null);
            // replaces _ids with snapchats
            var miniseries = [];
            _.forEach(user.subscriptions, function (subscription) {
                miniseries.push(function (cb) {
                    User_.findById(subscription.snapchat, function (err, user_) {
                        if (err) logger.warn(err);
                        if (!user_) {
                            logger.log('missing user: %s',subscription.snapchat);
                            user_ = {'snapchat':'Missing'};
                        }
                        subscription.snapchat = user_.snapchat;
                        cb(null);
                    });
                });
            });
            miniseries.push(function (cb) {
                step(null);
            });
            async.series(miniseries);
        },
        // Update Payouts
        function (step) {
            if (!user.payouts||user.payouts.length==0) return step(null);
            Payout.find({'_id': { '$in': user.payouts }}, function (err, payouts) {
                if (err) logger.warn(err);
                user.payouts = Payouts(payouts);
                step(null);
            });
        },
        function (step) {
            callback(null, user);
        }
    ]);
}
module.exports.User_Account = User_Account;

var Payout = function(src) {
    var payout = {
        date: moment(src.date).format('MM/DD/YYYY'),
        time: src.time,
        amount: src.amount || '0.00',
        status: src.status || 'pending',
    }
    return payout;
}

var Payouts = function(src) {
    var payouts = [];
    _.forEach(src, function (payout) {
        payouts.push(Payout(payout));
    });
    return payouts;
}
// module.exports.Payouts = Payouts;

var Performer = function(src) {
    var performer = {
        _id: src._id,
        name: src.name,
        username: src.username,
        gender: src.gender,
        snapchat: src.snapchat || '',
        snapchatDisplay: src.snapchatDisplay || 'PRIVATE',
        subscriptionText: src.subscriptionText || 'Subscribe',
        price: src.price,
        bio: src.bio,
    }

    if (src.instagram&&src.instagram.photos)
        performer.photos = src.instagram.photos;
    else
        performer.photos = [];

    // its presumed they have twitter info
    performer.image = src.twitter.profileImage;
    if (src.image)
        performer.image = '/assets/tmp/images/' + src.image;
    performer.imageName = src.imageName || '';
    performer.banner = src.twitter.bannerImage;
    if (src.banner)
        performer.banner = '/assets/tmp/images/' + src.banner;
    performer.bannerName = src.bannerName || '';

    return performer;
}
module.exports.Performer = Performer;

module.exports.Performers = function(src) {
    var performers = [];
    _.forEach(src, function (performer) {
        performers.push(Performer(performer));
    });
    return performers;
}

var Subscription = function(src) {
    var subscription = {
        date: moment(src.start).format('MM/DD/YYYY'),
        time: moment(src.start).format('HH:mm:ss'),
        amount: src.price,
        fee: src.fees_gross,
        net: src.nets_gross,
        total: src.total_gross,
        status: src.status
    }
    if (src.kind=='performer')
        subscription.snapchat = src.fan;
    else
        subscription.snapchat = src.performer;
    return subscription;
}

var Subscriptions = function(kind, src) {
    var subscriptions = [];
    _.forEach(src, function (subscription) {
        subscription.kind = kind;
        subscriptions.push(Subscription(subscription));
    });
    return subscriptions;
}