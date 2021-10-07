const connect = require('gulp-connect');
const gulp = require('gulp');

gulp.task('serve', () => {
  connect.server({
    // Serves the root of github repo so tests an access javascript files.
    root: '../../',
    port: 4000
  });
});
