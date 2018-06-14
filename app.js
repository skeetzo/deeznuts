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
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(sassMiddleware({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  indentedSyntax: false, // true = .sass and false = .scss
  sourceMap: true
}));
app.use(express.static(path.join(__dirname, 'public')));

// CSURF
var csrf = require('csurf');
app.use(csrf({cookie: true}));

var MongoStore = require('./modules/mongo');
var session = require('express-session');
var maxAge = 1 * 12 * 60 * 60 * 1000; // half a day
maxAge = 1 * 2 * 60 * 60 * 1000; // 2 hours
var sess = {
  name: "deek",
  secret: "Suck my dick",
  saveUninitialized: true,
  resave: true,
  cookie: {
      secure: false,
      // secure: 'auto',
      // domain: ,
      httpOnly: true,
      maxAge: maxAge
  },
  ephemeral: true,
  store:  MongoStore,
  proxy: true,
};
app.use(session(sess));

// Analytics - Google
// var nodalytics = require('nodalytics');
// app.use(nodalytics(config.Google_Analytics));

// Flash
var flash = require('express-flash');
app.use(flash());

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
