/**
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var allTests = require('./generated/all_tests');

var TEST_SERVER = 'http://localhost:4000';

describe('Run all Closure unit tests', function() {
  /**
   * Waits for current tests to be executed.
   * @param {function(!Object)} done The function called when the test is finished.
   * @param {function(!Error)} fail The function called when an unrecoverable error
   *     happened during the test.
   */
  var waitForTest = function(done, fail) {
    // executeScript runs the passed method in the "window" context of
    // the current test. JSUnit exposes hooks into the test's status through
    // the "G_testRunner" global object.
    browser.executeScript(function() {
      if (window['G_testRunner'] && window['G_testRunner']['isFinished']()) {
        return {
          isFinished: true,
          isSuccess: window['G_testRunner']['isSuccess'](),
          report: window['G_testRunner']['getReport']()
        };
      } else {
        return {'isFinished': false};
      }
    }).then(function(status) {
      if (status && status.isFinished) {
        done(status);
      } else {
        waitForTest(done, fail);
      }
    }, function(err) {
      // This can happen if the webdriver had an issue executing the script.
      fail(err);
    });
  };

  /**
   * Executes the test cases for the file at the given testPath.
   * @param {!string} testPath The path of the current test suite to execute.
   */
  var executeTest = function(testPath) {
    it('runs ' + testPath + ' with success', function(done) {
      /**
       * Runs the test routines for a given test path.
       * @param {function()} done The function to run on completion.
       */
      var runRoutine = function(done) {
        browser.navigate()
            .to(TEST_SERVER + '/' + testPath)
            .then(function() {
              waitForTest(function(status) {
                expect(status).toBeSuccess();
                done();
              }, function(err) {
                done.fail(err);
              });
            }, function(err) {
              done.fail(err);
            });
      };
      // Run the test routine.
      runRoutine(done);
    });
  };

  beforeEach(function() {
    jasmine.addMatchers({
      // This custom matcher allows for cleaner reports.
      toBeSuccess: function() {
        return {
          // Checks that the status report is successful, otherwise displays
          // the report as error message.
          compare: function(status) {
            return {
              pass: status.isSuccess,
              message: 'Some test cases failed!\n\n' + status.report
            };
          }
        };
      }
    });
  });

  if (!allTests.length) {
    throw new Error('Cannot find any JsUnit tests!!');
  }

  // Run all tests.
  for (var i = 0; i < allTests.length; i++) {
    var testPath = allTests[i];
    executeTest(testPath);
  }
});
