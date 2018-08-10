var config = require('../config/index'),
    logger = config.logger,
    _ = require('underscore'),
    mixins = require('../modules/mixins'),
    User = require('../models/user'),
    Video = require('../models/video');

module.exports = function homeRoutes(router) {

  router.get("/videos", mixins.loggedIn, function (req, res, next) {
    // logger.debug('video ids: %s', req.session.user.videos);
    Video.find({'_id':{'$in':req.session.user.videos}}, function (err, videos) {
      if (err) logger.warn(err);
      // logger.debug('videos: %s', JSON.stringify(videos, null, 4));
      req.session.locals.videos = mixins.Videos(videos);
      Video.find({'isOriginal':true,'isPreview':true}, function (err, videos_all) {
        if (err) logger.warn(err);
        // logger.debug('videos_all: %s',JSON.stringify(videos_all,null,4));
        if (videos_all.length==0) {
          var example = new Video({'title':'example-preview','performers':['Myself','Your Mom'],'isOriginal':true,'isPreview':true});
          videos_all.push(example);
          example.save();
        }
        // req.session.locals.videos = mixins.Videos(videos_all);
        req.session.locals.videos_all = mixins.Videos(videos_all);
        res.render('videos', req.session.locals);
      });
    });
  });

  // vod
  router.get("/address-vod", mixins.loggedIn, function (req, res, next) {
    User.generateAddress({'_id':req.session.user._id,'reason':'vod','video':req.query.video}, function (err) {
      if (err) {
        logger.warn(err);
        return res.sendStatus(404);
      }
      res.sendStatus(200);
    });
  });
}