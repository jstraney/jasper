var gulp = require("gulp"),
   concat = require("gulp-concat"),
   uglify = require("gulp-uglify"),
   less = require("gulp-less"),
   min = require("gulp-clean-css"),
   postCSS = require("gulp-postcss"),
   autoprefixer = require("autoprefixer"),
   browserSync = require("browser-sync").create(),
   order = require('gulp-order'),
   plumber = require("gulp-plumber");
   
gulp.task("js", function () {
  return gulp.watch("js/*.js", function () {
    gulp.src(["js/*.js", "js/lib/x2js-v1.1.5/xml2json.min.js"])
      .pipe(order([
        'xml2json.min.js',
        'jasper.js',
        'event.js',
        'asset.js',
        'entity.js',
        'controller.js',
        'graphics.js',
        'init.js'
        ]))
      .pipe(plumber())
      .pipe(concat("jasper.js"))
      .pipe(gulp.dest("js/test/"))
      .pipe(gulp.dest("js/dist/"))
      
      
    gulp.src("js/dist/jasper.js")
      .pipe(concat("jasper.min.js"))
      .pipe(uglify())
      .pipe(gulp.dest("."))
      .pipe(gulp.dest("../test"));
  });
});

gulp.task("css", function () {
  return gulp.watch("style/less/*.less", function () {
    gulp.src("style/less/*.less")
      .pipe(plumber())
      .pipe(less())
      .pipe(postCSS([autoprefixer({version: ['last 2 versions']})]))
      .pipe(min())
      .pipe(gulp.dest("style/css/"));
  });
});


gulp.task("default", ["js", "css"]);