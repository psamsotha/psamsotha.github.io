
var gulp = require('gulp');
var shell = require('gulp-shell');
var browserSync = require('browser-sync').create();

gulp.task('build', shell.task(['jekyll build']));
gulp.task('build:watch', shell.task(['jekyll build --watch']));

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

