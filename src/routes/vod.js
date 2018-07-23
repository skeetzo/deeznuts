var config = require('../config/index'),
    logger = config.logger,
    _ = require('underscore'),
    mixins = require('../modules/mixins'),
    User = require('../models/user'),
    Video = require('../models/video');

module.exports = function homeRoutes(router) {

  router.get("/videos", mixins.loggedIn, function (req, res, next) {
    Video.find({'_id':{'$in':req.session.user.videos}}, function (err, videos) {
      if (err) logger.warn(err);
      req.session.locals.videos = mixins.Videos(videos);
      Video.find({}, function (err, videos) {
        if (err) logger.warn(err);
        if (videos.length==0) {
          var example = new Video({'title':'example','performers':['Myself','Your Mom']});
          videos.push(example);
          example.save();
        }
        req.session.locals.videos_all = mixins.Videos(videos);
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