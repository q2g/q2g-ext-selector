'use strict';
var SenseGo = require( 'sense-go' );
var path = require( 'path' );
var less = require('gulp-less');
var webpack = require('gulp-webpack');

const senseGo = new SenseGo();
var gulp = senseGo.gulp;
var customConfig = senseGo.loadYml( path.join(__dirname, 'custom-config.yml'));


senseGo.init( customConfig, function () {

  gulp.task('copy:toTmp', function (done) {
    gulp.src('./src/**/*.js')
      .pipe(gulp.dest('./.tmp/src'));

    gulp.src('./src/**/*.css')
    .pipe(gulp.dest('./.tmp/src'));

    gulp.src(['q2g-ext-selector.qext', 'q2g-ext-selector.js', 'preview.png', 'package.json', 'LICENSE'])
      .pipe(gulp.dest('./.tmp'));

    gulp.src(['./node_modules/davinci.js/**/*.*'])
      .pipe(gulp.dest('./.tmp/node_modules/davinci.js'));

    return gulp.src(['./licenses/**/*.*'])
    .pipe(gulp.dest('./.tmp/licenses'));
  });

  gulp.task('less:transpile', function (done) {
    return gulp.src(['./src/**/*.less'], { base: './src/' })
    .pipe(less())
    .pipe(gulp.dest('./src/'));
  });

  gulp.task('default', function() {
    return gulp.src('.tmp/q2g-ext-selector.js')
      .pipe(webpack({
        resolveLoader:{
          alias: {
            text: "raw-loader",
            css: "css-loader"
          }
        }
      }))
      .pipe(gulp.dest('.tmp/dist/'));
  });




  
  
  // Create a custom task chain, re-using 'build'
	gulp.task('build', gulp.series([
  "shell"
  , "clean:tmp"
  , "less:transpile"
  , "copy:toTmp"
  , "default"
  // , "import:fromLocal"
  // , "less:reduce"
  // , "replace:tmp"
  // , "wbfolder:tmp"
  // , "clean:tmpIllegal"
  // , "jsonlint:tmp"
  // , "htmlmin:tmp"
  // , "cleanCss:tmp"
  // , "clean:buildDev"
  // , "header-js:tmp"
  // , "copy:tmpToDev"
  // , "zip:dev"
  // , "clean:localExtensionDir"
  // , "deploy:toLocal"
  // , "deploy:toSsh"
  // , "deploy:viaShell"
  // , "clean:tmp"
  ]));
	
	// Run it ...
  // gulp.series('customBuild')();
  

	// Run your tasks, e.g. with
	gulp.series(['build'])();
	
});