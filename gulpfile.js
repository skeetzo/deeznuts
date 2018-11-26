var gulp = require('gulp');
// var pug = require('gulp-pug');
// var less = require('gulp-less');
// var minifyCSS = require('gulp-csso');
var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');

gulp.task('socket.io', function() {
  gulp.src('node_modules/socket.io-client/dist/socket.io.js')
    .pipe(gulp.dest('src/public/dist/socket.io/socket.io.js'));
  return;
});

gulp.task('font-awesome', function() {
  gulp.src('node_modules/font-awesome/css/**.*')
    .pipe(gulp.dest('src/public/dist/font-awesome'));
  return;
});

gulp.task('bootstrap', function() {
  gulp.src('node_modules/bootstrap/dist/css/**.*')
    .pipe(gulp.dest('src/public/dist/bootstrap/css'));
  gulp.src('node_modules/bootstrap/dist/js/**.*')
    .pipe(gulp.dest('src/public/dist/bootstrap/js'));
  return;
});

gulp.task('flv', function() {
  // console.log('Moving flv.js...');
  return gulp.src('node_modules/flv.js/dist/**.*')
    .pipe(gulp.dest('src/public/dist/flv.js'));
});

gulp.task('jquery', function() {
  return gulp.src('node_modules/jquery/dist/**.*')
    .pipe(gulp.dest('src/public/dist/jquery'));
});

// gulp.task('html', function(){
//   return gulp.src('client/templates/*.pug')
//     .pipe(pug())
//     .pipe(gulp.dest('build/html'))
// });

// gulp.task('css', function(){
//   return gulp.src('client/templates/*.less')
//     .pipe(less())
//     .pipe(minifyCSS())
//     .pipe(gulp.dest('build/css'))
// });

// gulp.task('js', function(){
//   return gulp.src('node_modules/javascript/*.js')
//     .pipe(sourcemaps.init())
//     .pipe(concat('app.min.js'))
//     .pipe(sourcemaps.write())
//     .pipe(gulp.dest('build/js'))
// });

// gulp.task('default', [ 'html', 'css', 'js' ]);
gulp.task('default', [ 'font-awesome', 'bootstrap', 'flv', 'jquery' ]);