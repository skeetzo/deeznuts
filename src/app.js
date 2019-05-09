var config = require('./config/index'),
    logger = config.logger,
    path = require('path'),
    createError = require('http-errors'),
    _ = require('underscore'),
    express = require('express'),
    app = express();

_.forEach(_.keys(config.siteData),function(setting) {
  app.locals[setting] = config.siteData[setting];
});  

app.locals.pretty = true;
// app.locals.basedir = __dirname + '/views/pages/';
app.locals.cache = true;
app.locals.debug = false;

app.set('views', path.join(__dirname, 'views/pages'));
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

// Cors
var cors = require('cors');
app.use(cors({
    origin: config.domain, 
    allowedHeaders: [ 'Accept-Version', 'Authorization', 'Credentials', 'Content-Type' ]
}));

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

// CSURF
var csrf = require('csurf');
app.use(csrf({cookie: true}));

app.enable('trust proxy');
app.set('trust proxy', 1) // trust first proxy

var MongoStore = require('./modules/mongo');
var session = require('express-session');

var maxAge = 1 * 12 * 60 * 60 * 1000; // half a day
if (config.debugging) maxAge = 1000 * 60 * 10; // ten minutes

var sess = {
  name: "deeznuts",
  secret: "suckmybeautifulnuts",
  saveUninitialized: true,
  resave: true,
  cookie: {
      secure: false,
      // secure: 'auto',
      // domain: ,
      httpOnly: true,
      // sameSite: 'strict',
      maxAge: maxAge
  },
  // ephemeral: true,
  store:  MongoStore,
  proxy: true,
};
if (config.ssl) 
  sess.cookie.secure = true // serve secure cookies

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
var mixins = require('./modules/mixins');
app.use(mixins.resetLocals, function (req, res, next) {
  var ips = req.ips || [];
  ips.push(req.connection.remoteAddress);
  if (req.headers['x-forwarded-for'])
    ips.push(req.headers['x-forwarded-for']);
  logger.log("%s /%s %s", ips, req.method, req.url);
  // misc pages redirect
  if (_.contains(config.pages, req.url.replace('/','')))
    return res.render(req.url.replace('/',''), req.session.locals);
  next(null);
});

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
