var gulp = require('gulp'),
    $ = require('gulp-load-plugins')();

gulp.task('build', function() {
  return gulp.src('./src/sqlite.js')
    .pipe($.plumber())
    .pipe($.jshint())
    .pipe($.jshint.reporter('jshint-stylish'))
    .pipe($.umd({
      dependencies: function(file) {
        return [
          {
            name: 'lodash',
            amd: 'lodash',
            cjs: 'lodash',
            global: 'lodash',
            param: 'lodash'
          }
        ]
      },
      exports: function(file) {
        return 'sqlitejs';
      },
      namespace: function(file) {
        return 'sqlitejs';
      }
    }))
    .pipe(gulp.dest('./lib'))
    .pipe($.uglify())
    .pipe($.rename({ suffix: '.min' }))
    .pipe(gulp.dest('./lib'));
});

gulp.task('serve', function() {
  gulp.src('./')
    .pipe($.webserver({
      livereload: true,
      directoryListing: true
    }));
});

gulp.task('watch', ['build'], function() {
  gulp.watch('./src/sqlite.js', ['build']);
});

/*gulp.task('test-jasmine', ['build'], function() {
  return gulp.src('./spec/test.js')
    .pipe($.jasminePhantom({
      keepRunner: true,
      vendor: ['lib/sqlite.js'],
      integration: true
    }));
});*/

gulp.task('default', ['watch', 'serve']);