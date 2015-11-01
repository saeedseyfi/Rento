const gulp = require('gulp'),
  runsequence = require('run-sequence'),
  filter = require('gulp-filter'),
  jade = require('gulp-jade'),
  sass = require('gulp-sass'),
  autoprefixer = require('gulp-autoprefixer'),
  minifycss = require('gulp-minify-css'),
  uglify = require('gulp-uglify'),
  imagemin = require('gulp-imagemin'),
  pngquant = require('imagemin-pngquant'),
  rename = require('gulp-rename'),
  rimraf = require('rimraf'),
  concat = require('gulp-concat'),
  livereload = require('gulp-livereload'),
  paperboy = require('paperboy'),
  http = require('http'),
  path = require('path'),
  open = require("open"),
  util = require('gulp-util');


// Clear console (get rid of the dirts on the plate that make me confused)
console.reset = function () {
  return process.stdout.write('\033c');
}
console.reset();

// Reserve localhost:8080 to load files
var webroot = path.join('dist'),
port = 8080;
http.createServer(function (req, res) {
  var ip = req.connection.remoteAddress;
  paperboy
  .deliver(webroot, req, res)
  .addHeader('X-Powered-By', 'Atari')
  .before(function () {
    //console.log('Request received for ' + req.url);
  })
  .after(function (statusCode) {
    if(statusCode != 200 && statusCode != 304){
      console.log(statusCode + ' - ' + req.url + ' ' + ip);
    }
  })
  .error(function (statusCode, msg) {
    console.log([statusCode, msg, req.url, ip].join(' '));
    res.writeHead(statusCode, { 'Content-Type': 'text/plain' });
    res.end('Error [' + statusCode + ']');
  })
  .otherwise(function (err) {
    console.log([404, err, req.url, ip].join(' '));
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Error 404: File not found');
  });
}).listen(port);

// Clear dist folder
gulp.task('clean', function (cb) {
  return rimraf('dist', cb);
});

// Built template files
gulp.task('templates', function () {
  return gulp.src('src/templates/*.jade')
  .pipe(jade())
  .on('error', util.log)
  .pipe(gulp.dest('dist/'))
  .pipe(livereload());
});

// Build twitter bootstrap files
gulp.task('styles-bootstrap', function () {
  return gulp.src(['src/styles/*.css','!src/styles/front-end-test-icons.css'])
  .pipe(concat('bootstrap.min.css'))
    .pipe(minifycss())
    .pipe(gulp.dest('dist/assets/css'))
    .pipe(livereload());
});

// Build scss styles
gulp.task('styles-custom', function () {
  return gulp.src(['src/styles/**/*.scss','!src/styles/**/!variables.scss'])
  .pipe(sass({ outputStyle: 'expanded' }))
  .on('error', util.log)
  .pipe(autoprefixer('last 9 version'))
  .pipe(rename({ suffix: '.min' }))
    .pipe(minifycss())
    .pipe(gulp.dest('dist/assets/css'))
    .pipe(livereload());
});

// Copy font-icon files
gulp.task('font-icons-fonts', function () {
  return gulp.src('src/fonts/*')
    .pipe(gulp.dest('dist/assets/fonts'));
});

// Build font-icon files
gulp.task('font-icons-styles', function () {
  return gulp.src('src/styles/front-end-test-icons.css')
    .pipe(minifycss())
    .pipe(rename({suffix:'.min'}))
    .pipe(gulp.dest('dist/assets/css'))
    .pipe(livereload());
});

// Font-icons task
gulp.task('font-icons', ['font-icons-styles','font-icons-fonts']);

// Styles task
gulp.task('styles', ['styles-custom', 'styles-bootstrap','font-icons']);

// Copy html5shiv
gulp.task('html5shiv',function(){
  return gulp.src('src/scripts/01-LoadFirst/html5shiv.js')
    .pipe(gulp.dest('dist/assets/js'));
});

// Build scripts
gulp.task('scripts',['html5shiv'], function () {
  return gulp.src(['src/scripts/**/*.js', '!src/scripts/**/html5shiv.js'])
    .pipe(uglify())
    .pipe(concat('script.min.js'))
    .pipe(gulp.dest('dist/assets/js'))
    .pipe(livereload());
});

// Optimize images
gulp.task('images', function () {
  var iconsFilter = filter('*.ico');
  return gulp.src('src/images/*')
  .pipe(imagemin({
    progressive: true,
    svgoPlugins: [{removeViewBox: false}],
    use: [pngquant()]
  }))
  .pipe(gulp.dest('dist/assets/img'))
  .pipe(iconsFilter)
  .pipe(gulp.dest('dist'))
  .pipe(livereload());
}); 

// Whatch for changes
gulp.task('watch', function () {
  livereload.listen();
    gulp.watch('src/templates/**/*.jade', ['templates']); // Watch .jade files
    gulp.watch('src/styles/*.scss', ['styles-custom']); // Watch .scss files
    gulp.watch('src/styles/*.css', ['styles']); // Watch .css files
    gulp.watch('src/scripts/**/*.js', ['scripts']);// Watch .js files
    gulp.watch('src/images/*', ['images']); // Watch image files
  });

// Open browser to see project result
gulp.task('openproject',function(){
  return open('http://localhost:' + port + '/rent.html');
})


// Set the default task to run other tasks according to therir priority
gulp.task('default', function (callback) {
  runsequence('clean',
    ['templates','styles', 'scripts', 'images'],
    ['watch','openproject'],
    callback);
});