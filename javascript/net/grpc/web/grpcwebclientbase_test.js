/**
 *
 * Copyright 2018 Google LLC
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
 *
 */
goog.module('grpc.web.GrpcWebClientBaseTest');
goog.setTestOnly('grpc.web.GrpcWebClientBaseTest');

var testSuite = goog.require('goog.testing.testSuite');
goog.require('goog.testing.jsunit');

testSuite({
  setUp: function() {
  },

  tearDown: function() {
  },


  testTrivial: function() {
    assertEquals(1, 1);
  },
});
