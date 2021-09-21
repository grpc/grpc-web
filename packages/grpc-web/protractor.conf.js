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

/**
 * Stores the configuration of Protractor. It is loaded by protractor to run
 * tests.
 *
 * Intended to be used through ./run_jsunit_test.sh
 */

// Common configuration.
config = {
  // Using jasmine to wrap Closure JSUnit tests.
  framework: 'jasmine',
  // The jasmine specs to run.
  specs: ['protractor_spec.js'],
  // Jasmine options. Increase the timeout to 5min instead of the default 30s.
  jasmineNodeOpts: {
    // Default time to wait in ms before a test fails.
    defaultTimeoutInterval: 5 * 60 * 1000 // 5 minutes
  }
};

// Configuration for headless chrome.
config.directConnect = true;
config.multiCapabilities = [{
  browserName: 'chrome',
  chromeOptions: {
    args: [ "--headless", "--disable-gpu", "--window-size=800,600",
            "--no-sandbox", "--disable-dev-shm-usage" ]
  }
}];

exports.config = config;
