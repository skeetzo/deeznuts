var config = require('../config/index'),
    logger = config.logger,
    _ = require('underscore'),
    mixins = require('../modules/mixins');

module.exports = function homeRoutes(router) {

  router.get("/videos", mixins.loggedIn, function (req, res, next) {
    var Video = require('../models/video');
    // logger.debug('video ids: %s', req.session.user.videos);
    Video.find({'_id':{'$in':req.session.user.videos}}, function (err, videos) {
      if (err) logger.warn(err);
      // logger.debug('videos: %s', videos.length);
      req.session.locals.videos = mixins.Videos(videos);
      Video.find({'hasPreview':true,'_id':{'$nin':req.session.user.videos}}, function (err, videos_unowned) {
        if (err) logger.warn(err);
        // logger.debug('videos_unowned: %s', videos_unowned.length);
        // req.session.locals.videos = mixins.Videos(videos_all);
        req.session.locals.videos_unowned = mixins.Videos(videos_unowned);
        if (videos.length==0&&videos_unowned.length>0) req.session.locals.message = 'Purchase a video below!';
        res.render('videos', req.session.locals);
      });
    });
  });

  router.post("/buy", mixins.loggedIn,  function (req, res, next) {
    require('../models/user').findById(req.session.user._id, function (err, user) {
      if (err) {
        logger.warn(err);
        return res.sendStatus(400);
      }
      if (!user) {
        logger.warn('Missing User!');
        return res.sendStatus(404);
      }
      user.purchaseVideo(req.body.video, function (err, text) {
        if (err) {
          logger.warn(err);
          return res.sendStatus(404);
        }
        if (!text) text = "There was an error!";
        res.status(200).send({'text':text});
      });
    });
  });

  // router.get("/download", mixins.loggedIn,  function (req, res, next) {
  //   async.waterfall([
  //       function (step) {
  //         User.findById(req.session.user._id, function (err, user) {
  //           if (err) return step(err);
  //           if (!user) return step('Missing User!');
  //           step(null, user);            
  //         });
  //       },
  //       function (user, step) {
  //         Video.findById(req.query.video, function (err, video) {
  //           if (err) return step(err);
  //           if (!video) return step('Missing Video!');
  //           step(null, user, video);
  //         });
  //       },
  //       function (user, video, step) {
  //         logger.log('User downloading video: %s -> %s', video.title, user._id);
  //         step(null);
  //       }
  //     ], function (err) {
  //       if (err) {
  //         logger.warn(err);
  //         return res.sendStatus(400);
  //       }
  //       res.sendStatus(200);
  //   });
  // });

}