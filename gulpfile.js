
var gulp = require('gulp');
var shell = require('gulp-shell');
var browserSync = require('browser-sync').create();
var svgstore = require('gulp-svgstore');
var inject = require('gulp-inject');
var ghPages = require('gulp-gh-pages');

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


gulp.task('build', ['svgstore'], shell.task(['jekyll build']));
gulp.task('build:watch', ['svgstore'], shell.task(['jekyll build --watch']));

gulp.task('jekyll-production', function() {
    return process.env.JEKYLL_ENV = 'production';
});

gulp.task('serve', function () {
	browserSync.init({ 
		server: { 
			baseDir: '_site/'
		}
	});

	gulp.watch('_site/**/*.*').on('change', browserSync.reload);
});

gulp.task('build:prod', ['jekyll-production', 'build']);
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

