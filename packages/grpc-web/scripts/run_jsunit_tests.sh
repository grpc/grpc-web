#!/bin/bash
# Copyright 2021 Google Inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# This script starts a local HTTP server to serve test files, starts a Selenium Webdriver, and
# runs the unit tests using Protractor.
# Run locally with Pratractor:
#
# Usage (under ./packages/grpc-web):
# $ ./scripts/generate_test_files.sh # Required first step
# $ ./scripts/run_jsunit_tests.sh
#
# Or (preferred use):
# $ npm run test-jsunit

set -e

cd "$(dirname $(dirname "$0"))"
NPM_BIN_PATH=$(npm bin)
PROTRACTOR_BIN_PATH="./node_modules/protractor/bin"

function cleanup () {
  echo "Killing HTTP Server..."
  kill $serverPid
}

# Start the local webserver.
echo "Starting local HTP Server..."
$NPM_BIN_PATH/gulp serve &
serverPid=$!
echo "Local HTTP Server started with PID $serverPid."

trap cleanup EXIT

echo "Using Headless Chrome."
# Updates Selenium Webdriver.
echo "$PROTRACTOR_BIN_PATH/webdriver-manager update --gecko=false"
$PROTRACTOR_BIN_PATH/webdriver-manager update --gecko=false

# Run the tests using Protractor! (Protractor should run selenium automatically)
$PROTRACTOR_BIN_PATH/protractor protractor.conf.js
