'use strict';

var gulp = require('gulp');
var concat = require('gulp-concat');
var stripDebug = require('gulp-strip-debug');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var runSequence = require('run-sequence');
var cleanCss = require('gulp-clean-css');

var DEST = 'src/main/resources/static/build/';

gulp.task('build-js', function() {
    return gulp.src([
            "src/main/resources/static/js/vendor/jquery-1.12.4.js",
            "src/main/resources/static/js/vendor/jquery.cookie.js",
            "src/main/resources/static/js/vendor/jquery-ui.js",
            "src/main/resources/static/js/vendor/jquery.iframe-transport.js",
            "src/main/resources/static/js/vendor/jquery.fileupload.js",
            "src/main/resources/static/js/vendor/sockjs-1.1.1.js",
            "src/main/resources/static/js/vendor/stomp.js",
            "src/main/resources/static/js/vendor/angular.js",
            "src/main/resources/static/js/vendor/angular-touch.js",
            "src/main/resources/static/js/vendor/bootstrap.js",
            "src/main/resources/static/js/vendor/d3.js",
            "src/main/resources/static/js/vendor/dagre.js",
            "src/main/resources/static/js/vendor/dagre-d3.js",
            "src/main/resources/static/js/statusIndicator.js",
            "src/main/resources/static/js/liquidFillGauge.js",
            "src/main/resources/static/js/barChart.js",
            "src/main/resources/static/js/lineChart.js",
            "src/main/resources/static/js/pieChart.js",
            "src/main/resources/static/js/application.js",
            "src/main/resources/static/js/angularDirectives.js",
            "src/main/resources/static/js/angularService.js",
            "src/main/resources/static/js/userController.js",
            "src/main/resources/static/js/dashboardController.js",
            "src/main/resources/static/js/monitorController.js",
            "src/main/resources/static/js/dataflowDiagram.js",
            "src/main/resources/static/js/datastructureDiagram.js",
            "src/main/resources/static/js/exampleCharts.js"
        ])
        .pipe(concat('urim.js'))
        .pipe(gulp.dest(DEST))
        .pipe(stripDebug())
        .pipe(uglify({
            compress: {
                drop_console: true
            }
        }))
        .pipe(rename({ extname: '.min.js' }))
        .pipe(gulp.dest(DEST));
});

gulp.task('build-test-js', function() {
    return gulp.src([
            "src/main/resources/static/js/vendor/jquery-1.12.4.js",
            "src/main/resources/static/js/vendor/jquery.cookie.js",
            "src/main/resources/static/js/vendor/jquery-ui.js",
            "src/main/resources/static/js/vendor/jquery.iframe-transport.js",
            "src/main/resources/static/js/vendor/jquery.fileupload.js",
            "src/main/resources/static/js/vendor/sockjs-1.1.1.js",
            "src/main/resources/static/js/vendor/stomp.js",
            "src/main/resources/static/js/vendor/angular.js",
            "src/main/resources/static/js/vendor/angular-touch.js",
            "src/main/resources/static/js/vendor/bootstrap.js",
            "src/main/resources/static/js/vendor/d3.js",
            "src/main/resources/static/js/vendor/chai.js",
            "src/main/resources/static/js/vendor/mocha.js",
            "src/main/resources/static/js/test/application.js",
            "src/main/resources/static/js/vendor/angular-mocks.js",
            "src/main/resources/static/js/statusIndicator.js",
            "src/main/resources/static/js/liquidFillGauge.js",
            "src/main/resources/static/js/barChart.js",
            "src/main/resources/static/js/lineChart.js",
            "src/main/resources/static/js/pieChart.js",
            "src/main/resources/static/js/angularDirectives.js",
            "src/main/resources/static/js/angularService.js",
            "src/main/resources/static/js/userController.js",
            "src/main/resources/static/js/dashboardController.js",
            "src/main/resources/static/js/monitorController.js",
            "src/main/resources/static/js/test/userController.js",
            "src/main/resources/static/js/test/dashboardController.js",
            "src/main/resources/static/js/test/monitorController.js"
        ])
        .pipe(concat('urim-test.js'))
        .pipe(gulp.dest(DEST))
        .pipe(stripDebug())
        .pipe(uglify({
             compress: {
                 drop_console: true
             }
        }))
        .pipe(rename({ extname: '.min.js' }))
        .pipe(gulp.dest(DEST));
});

gulp.task('build-css', function() {
    return gulp.src([
            "src/main/resources/static/css/bootstrap.min.css", 
            "src/main/resources/static/css/bootstrap-theme.min.css", 
            "src/main/resources/static/css/font-awesome.min.css", 
            "src/main/resources/static/css/application.css"
        ])
        .pipe(concat('urim.css'))
        .pipe(gulp.dest(DEST))
        .pipe(cleanCss())
        .pipe(rename({ extname: '.min.css' }))
        .pipe(gulp.dest(DEST));
});

gulp.task('build-test-css', function() {
    return gulp.src([
            "src/main/resources/static/css/mocha.css"
        ])
        .pipe(concat('urim-test.css'))
        .pipe(gulp.dest(DEST))
        .pipe(cleanCss())
        .pipe(rename({ extname: '.min.css' }))
        .pipe(gulp.dest(DEST));
});

gulp.task('build', function() {
    runSequence(
        'build-js',
        'build-test-js',
        'build-css',
        'build-test-css'
    )
});

