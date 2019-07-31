const gulp = require('gulp');
const gulpEval = require('gulp-eval');
gulp.task('default', () =>
  gulp.src('./foo_grpc_web_pb.js')
      .pipe(gulpEval())
);
