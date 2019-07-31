const gulp = require('gulp');
const gulpEval = require('gulp-eval');

gulp.task('gen-code-eval-test', () =>
  gulp.src('./generated/foo_grpc_web_pb.js')
      .pipe(gulpEval())
);
