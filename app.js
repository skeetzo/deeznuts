var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var sassMiddleware = require('node-sass-middleware');
var config = require('./config/index');
var _ = require('underscore');

var app = express();

_.forEach(_.keys(config.siteData),function(setting) {
  app.locals[setting] = config.siteData[setting];
});  

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(require('helmet')());
// Body Parsers
// parse application/x-www-form-urlencoded
var bodyParser = require('body-parser');
// parse application/json
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

app.use(cookieParser('suckafatone'));
var outputStyle = 'minified';
if (config.debugging) outputStyle = 'extended';
app.use(sassMiddleware({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  outputStyle: outputStyle,
  indentedSyntax: true, // true = .sass and false = .scss
  sourceMap: true
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname, { dotfiles: 'allow' } ));

// CSURF
var csrf = require('csurf');
app.use(csrf({cookie: true}));

app.enable('trust proxy');

var MongoStore = require('./modules/mongo');
var session = require('express-session');
var maxAge = 1 * 12 * 60 * 60 * 1000; // half a day
maxAge = 1 * 2 * 60 * 60 * 1000; // 2 hours
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
  ephemeral: true,
  store:  MongoStore,
  proxy: true,
};
if (app.get('env') === 'production') {
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
var passport = require('./modules/passport');
app.use(passport.initialize());
app.use(passport.session());

// SSL
// app.use (function (req, res, next) {
//   if (req.secure) {
//     config.logger.log('secure: %s', req.secure);
//     // request was via https, so do no special handling
//     next();
//   } else {
//     config.logger.log('not secure: %s', req.secure);
//     // request was via http, so redirect to https
//     res.redirect('https://' + req.headers.host + req.url);
//   }
// });

// /
app.use('/', require('./routes/index'));

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
  
  config.logger.warn(err);
});

module.exports = app;
