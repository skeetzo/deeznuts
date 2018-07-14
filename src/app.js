var config = require('./config/index'),
    logger = config.logger,
    path = require('path'),
    createError = require('http-errors'),
    _ = require('underscore'),
    crypto = require('crypto'),
    express = require('express'),
    app = express();

_.forEach(_.keys(config.siteData),function(setting) {
  app.locals[setting] = config.siteData[setting];
});  

app.locals.pretty = true;
// app.locals.basedir = __dirname + '/views/pages/';
app.locals.cache = true;
app.locals.debug = false;

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
// app.set('view options',{layout:false});

var morgan = require('morgan');
app.use(morgan('dev'));
app.use(require('helmet')());

// Body Parsers
// parse application/x-www-form-urlencoded
var bodyParser = require('body-parser');
// parse application/json
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

// Validator & Sanitizer
// var expressValidator = require('express-validator');
// app.use(expressValidator()); // this line must be immediately after any of the bodyParser middlewares!

// Cookie Parser
var cookieParser = require('cookie-parser');
app.use(cookieParser('Suck my dick'));

// Sass
var outputStyle = 'minified';
if (config.debugging) outputStyle = 'extended';
var sass = require('node-sass-middleware');
app.use(sass({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  outputStyle: outputStyle,
  debug: false,   
  indentedSyntax: true, // true = .sass and false = .scss
  sourceMap: true
  // prefix:  '/public'  // Where prefix is at <link rel="stylesheets" href="prefix/style.css"/>
}));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname, { dotfiles: 'allow' } ));

// var multer = require('multer');
// // app.use(multer({dest:'./src/tmp/images'}));
// var storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, './public/tmp/images')
//   },
//   filename: function (req, file, cb) {
//     crypto.pseudoRandomBytes(16, function (err, raw) {
//       if (err) return cb(err);
//       var fileName = raw.toString('hex').substring(0,6) + path.extname(file.originalname);
//       logger.log('File Uploaded: %s',fileName);
//       cb(null, fileName);
//     });
//   }
// });
// app.use(multer({ 'storage': storage }).single('file')); //Beware, you need to match .single() with whatever name="" of your file upload field in html

// CSURF
var csrf = require('csurf');
app.use(csrf({cookie: true}));

app.enable('trust proxy');

var MongoStore = require('./modules/mongo');
var session = require('express-session');

var maxAge = 1 * 12 * 60 * 60 * 1000; // half a day
maxAge = 1 * 2 * 60 * 60 * 1000; // 2 hours
if (config.debugging) maxAge = 5 * 60 * 1000; // five minutes

var sess = {
  name: "deek",
  secret: "Suck my dick",
  saveUninitialized: false,
  resave: true,
  cookie: {
      secure: false,
      // secure: 'auto',
      // domain: ,
      httpOnly: true,
      sameSite: 'strict',
      maxAge: maxAge
  },
  // ephemeral: true,
  store:  MongoStore,
  proxy: true,
};
if (!config.debugging) {
  app.set('trust proxy', 1) // trust first proxy
  sess.cookie.secure = true // serve secure cookies
}
app.use(session(sess));

// Analytics - Google
var nodalytics = require('nodalytics');
app.use(nodalytics(config.Google_Analytics));

// Flash
var flash = require('express-flash');
app.use(flash());

// Passport
var passport = require('./modules/passports');
app.use(passport.initialize());
app.use(passport.session());

// force SSL
if (config.ssl)
  app.use (function (req, res, next) {
    if (req.secure) {
      // logger.log('secure: %s', req.secure);
      next();
    } else {
      logger.log('REDIRECTING: %s', req.secure);
      res.redirect('https://' + req.headers.host + req.url);
    }
  });

// /
var router = express.Router();
require('./routes/index')(router);
app.use("/", router);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
  
  logger.warn(err.message);
});

module.exports = app;
