const gulp = require('gulp');
const browserSync = require('browser-sync').create();
const reload = browserSync.reload;
const cssmin = require('gulp-cssmin');
const sass = require('gulp-sass');
const imagemin = require('gulp-imagemin');
const newer = require('gulp-newer');
const rename = require('gulp-rename');
const hash = require('gulp-hash');
const fs = require('fs-extra');
const lastRunFile = '.lastrun';
const nunjucksRender = require('gulp-nunjucks-render');
const src = {
	scss : 'app/scss/**/*.scss',
	css : 'app/css',
	njk : 'app/**/*.njk',
	html : 'app/*.html',
	image : 'app/images/**/*.+(jpg|png)',
	dist : 'dist/'
};

try {
	fs.accessSync(lastRunFile, fs.R_OK | fs.W_OK);	
} catch (error) {
	fs.writeFileSync(lastRunFile, '{}');	
}

var gulpLastRun = fs.readFileSync(lastRunFile, 'utf8'),
	gulpLastRun = JSON.parse(gulpLastRun);

var lastRun = function(key) {
	fs.writeFileSync(lastRunFile, JSON.stringify(gulpLastRun));
	lastValue = gulpLastRun[key];
	gulpLastRun[key] = Math.floor(new Date());
	return lastValue;
}

gulp.task('nunjucks', function() {
	return gulp.src('app/pages/*.+(html|njk|nunjucks)')
		.pipe(nunjucksRender({
			path: ['app/templates/']
		}))
		.pipe(gulp.dest('app'))
		.pipe(browserSync.stream());
});

gulp.task('html', function() {
	return gulp.src(src.html)
		.pipe(newer(src.html))
		.pipe(gulp.dest(src.dist));
});

gulp.task('images', function() {
	return gulp.src(src.image)
		.pipe(imagemin([
			imagemin.jpegtran({progressive: true})
		]))
		.pipe(rename(function(path) {
			path.basename = path.dirname + '-' + path.basename;
			path.dirname = '';
		}))
		.pipe(hash({ template: '<%= name %>.<%= hash %><%= ext %>' }))
		.pipe(gulp.dest(src.dist + 'images/'))
});

gulp.task('css', function() {
	return gulp.src(src.css)
		.pipe(newer(src.css))
		.pipe(gulp.dest(src.dist));
});

gulp.task('scss', function() {
	return gulp.src(src.scss)
		.pipe(sass().on('error', sass.logError))
		.pipe(gulp.dest(src.css))
		.pipe(browserSync.stream());
});

gulp.task('minify-css', function() {
	return gulp.src(src.css + '/*.css')
		.pipe(cssmin())
		.pipe(hash({ template: '<%= name %>.<%= hash %><%= ext %>' }))
		.pipe(gulp.dest(src.dist + 'css'));
});

gulp.task('bs', function() {
	browserSync.init({
		server: "./app",
		port: '9000',
	});

	gulp.watch(src.njk, gulp.parallel('nunjucks'));
	gulp.watch(src.image, gulp.parallel('images'));
	gulp.watch(src.scss, gulp.parallel('scss'));
	gulp.watch(src.html).on('change', reload);
});

gulp.task('serve', gulp.parallel('images', 'scss', 'nunjucks', 'bs'));
gulp.task('production', gulp.series('html','images', 'scss', 'minify-css', 'css'))