var config = require('../config/index'),
    logger = config.logger,
    _ = require('underscore'),
    mixins = require('../modules/mixins'),
    User = require('../models/user'),
    Video = require('../models/video');

module.exports = function homeRoutes(router) {

  router.get("/videos", mixins.loggedIn, function (req, res, next) {
    logger.debug('video ids: %s', req.session.user.videos);
    Video.find({'_id':{'$in':req.session.user.videos},'isPaid':true}, function (err, videos) {
      if (err) logger.warn(err);
      logger.debug('videos: %s', videos.length);
      req.session.locals.videos = mixins.Videos(videos);
      Video.find({'hasPreview':true,'_id':{'$nin':req.session.user.videos}}, function (err, videos_unowned) {
        if (err) logger.warn(err);
        logger.debug('videos_unowned: %s', videos_unowned.length);
        // req.session.locals.videos = mixins.Videos(videos_all);
        req.session.locals.videos_unowned = mixins.Video_Previews(videos_unowned);
        if (videos.length==0&&videos_unowned.length>0) req.session.locals.message = 'Purchase a video below!';
        res.render('videos', req.session.locals);
      });
    });
  });

  router.post("/buy", mixins.loggedIn,  function (req, res, next) {
    User.findById(req.session.user._id, function (err, user) {
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
}