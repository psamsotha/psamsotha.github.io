
var gulp = require('gulp');
var shell = require('gulp-shell');
var browserSync = require('browser-sync').create();
var svgstore = require('gulp-svgstore');
var inject = require('gulp-inject');
var ghPages = require('gulp-gh-pages');
var concat = require("gulp-concat");
var rename = require("gulp-rename");
var uglify = require("gulp-uglify");
var exec = require('child_process').exec;
var del = require('del');

var paths = {
  jsDist: '_site/js'
};

var config = {
  jsFiles: [
    paths.jsDist + '/vendor/jquery.js',
    paths.jsDist + '/vendor/what-input.js',
    paths.jsDist + '/vendor/foundation.min.js',
    paths.jsDist + '/app.js'
  ]
};

/**
 * Concatenate svg files and inject into svgs.html
 */
gulp.task('svgstore', function () {
  var svgs = gulp
    .src('./assets/svg/*.svg')
    .pipe(svgstore({ inlineSvg: true }));

  function fileContents(filepath, file) {
    return file.contents.toString();
  }

  return gulp
    .src('./_includes/svgs.html')
    .pipe(inject(svgs, { transform: fileContents }))
    .pipe(gulp.dest('./_includes'));
});

/**
 * Concatenate JS files and unglify
 */
gulp.task('minify-js', ['build'], function (done) {
  gulp.src(config.jsFiles)
    .pipe(concat('concat.js'))
    .pipe(gulp.dest('tmp'))
    .pipe(rename('main.js'))
    .pipe(uglify())
    .pipe(gulp.dest(paths.jsDist))
    .on('end', cleanup);

  function cleanup() {
    var allDelete = config.jsFiles.slice();
    allDelete.push(paths.jsFiles + '/vendor');
    allDelete.push('tmp');

    del(allDelete, done);
  }
});

/**
 * Serve with browser-sync, listening for file changes.
 */
gulp.task('serve', function () {
	browserSync.init({ 
		server: { 
			baseDir: '_site/'
		}
	});

	gulp.watch('_site/**/*.*').on('change', browserSync.reload);
});

/**
 * Simple Jekyll build. We are using `exec` instead of `gulp.shell`, as 
 * `gulp-shell` doesn't allow for any callback. So we can't make an 
 * async task from it.
 */
gulp.task('build', ['svgstore'], function(done) {
  var build = exec('jekyll build --incremental', { maxBuffer: 1024 * 1024 }, function (error) {
    if (error) {
      console.error(error);
      done(error);
    } else {
      console.log('no error');
      done();
    }
  });
  build.stdout.on('data', function (data) {
    process.stdout.write(data.toString());
  });
  build.stderr.on('data', function (data) {
    process.stderr.write(data.toString());
  });
  build.on('exit', function (code) {
    process.stdout.write('jekyll build exited\n');
  });
});

gulp.task('jekyll-production', function() {
    return process.env.JEKYLL_ENV = 'production';
});

gulp.task('build:watch', ['svgstore'], shell.task(['jekyll build --watch']));
gulp.task('build:prod', ['jekyll-production', 'build', 'minify-js']);
gulp.task('build:prod:watch', ['jekyll-production', 'build:watch']);
gulp.task('serve:prod', ['build:prod:watch', 'serve']);
gulp.task('default', ['build:watch', 'serve']);

/**
 * Deploy built _site files to master branch. This is the branch
 * used for hosting the site using the user (psamsotha.github.io) project name
 */
gulp.task('deploy', ['build:prod'], function() {
  return gulp.src('./_site/**/*')
    .pipe(ghPages({ branch: 'master' }));
});

