var config = require('../config/index'),
    logger = config.logger,
    _ = require('underscore'),
    mixins = require('../modules/mixins');

var Video = require('../models/video');

const paginate = require('express-paginate');


module.exports = function homeRoutes(router) {
  
  // keep this before all routes that will use pagination
  router.use(paginate.middleware(10, 50));

  router.get("/archive", mixins.loggedIn, function (req, res, next) {
    // logger.debug('video ids: %s', req.session.user.videos);
    Video.find({'archived':true}, function (err, videos) {
      if (err) logger.warn(err);
      // logger.debug('videos: %s', videos.length);
      req.session.locals.videos = mixins.Videos(videos);
      res.render('archive', req.session.locals);
    });
  });

  router.get("/videos", mixins.loggedIn, function (req, res, next) {

    // pagination  
    // require('async').series([
    //   function (step) {
    //     paginater(req, res, function (err) {
    //       if (err) logger.warn(err);
    //       step(null);
    //     });
    //   },
    //   function (step) {
    //     paginater(req, res, function (err) {
    //       if (err) logger.warn(err);
    //       step(null);
    //     });
    //   },
    //   function (step) {
    //     res.render('videos', req.session.locals);
    //   }
    // ])

    logger.debug('video ids: %s', req.session.user.videos);
    Video.find({'_id':{'$in':req.session.user.videos}}, function (err, videos) {
      if (err) logger.warn(err);
      logger.debug('videos: %s', videos.length);
      req.session.locals.videos = mixins.Videos(videos);
      Video.find({'hasPreview':true,'_id':{'$nin':req.session.user.videos}}, function (err, videos_unowned) {
        if (err) logger.warn(err);
        logger.debug('videos_unowned: %s', videos_unowned.length);
        req.session.locals.videos_unowned = mixins.Video_Previews(videos_unowned);
        if (req.session.locals.videos.length==0&&req.session.locals.videos_unowned.length>0) req.session.locals.message = 'Purchase a video below!';
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



async function paginater(req, res, callback) {
  try {

    const [ results, itemCount, results2, itemCount2 ] = await Promise.all([
      Video.find({'hasPreview':true}).limit(req.query.limit).skip(req.skip).lean().exec(),
      Video.count({'hasPreview':true}),
      Video.find({'hasPreview':true,'_id':{'$nin':req.session.user.videos}}).limit(req.query.limit).skip(req.skip).lean().exec(),
      Video.count({'hasPreview':true,'_id':{'$nin':req.session.user.videos}})
    ]);

    const pageCount = Math.ceil(itemCount / req.query.limit);
    const pageCount2 = Math.ceil(itemCount2 / req.query.limit);

    if (req.accepts('json')) {
      // inspired by Stripe's API response for list objects
      res.json({
        object: 'list',
        has_more: paginate.hasNextPages(req)(pageCount),
        data: results
      });
    } else {
      req.session.locals.videos = mixins.Videos(results)
      req.session.locals.pageCount = pageCount
      req.session.locals.itemCount = itemCount
      req.session.locals.pages = paginate.getArrayPages(req)(3, pageCount, req.query.page)

    } 

    if (req.accepts('json')) {
      // inspired by Stripe's API response for list objects
      res.json({
        object: 'list',
        has_more: paginate.hasNextPages(req)(pageCount2),
        data: results2
      });
    } else {

      req.session.locals.videos = mixins.Videos(results2)
      req.session.locals.pageCount_unowned = pageCount2
      req.session.locals.itemCount_unowned = itemCount2
      req.session.locals.pages_unowned = paginate.getArrayPages(req)(3, pageCount2, req.query.page)

      // res.render('videos', {
      //   users: results,
      //   pageCount,
      //   itemCount,
      //   pages: paginate.getArrayPages(req)(3, pageCount, req.query.page)
      // });
    }

  } catch (err) {
    // callback(err);
    logger.warn(err);
  }
  callback(null)
}