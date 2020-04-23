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

const {Empty} = require('./src/proto/grpc/testing/empty_pb.js');
const {SimpleRequest,
       StreamingOutputCallRequest,
       EchoStatus,
       Payload,
       ResponseParameters} =
         require('./src/proto/grpc/testing/messages_pb.js');
const {TestServiceClient} =
  require('./src/proto/grpc/testing/test_grpc_web_pb.js');
var assert = require('assert');
const grpc = {};
grpc.web = require('grpc-web');

const SERVER_HOST = 'http://localhost:8080';

function multiDone(done, count) {
  return function() {
    count -= 1;
    if (count <= 0) {
      done();
    }
  };
}

function doEmptyUnary(done) {
  var testService = new TestServiceClient(SERVER_HOST, null, null);
  testService.emptyCall(new Empty(), null, (err, response) => {
    assert.ifError(err);
    assert(response instanceof Empty);
    done();
  });
}

function doLargeUnary(done) {
  var testService = new TestServiceClient(SERVER_HOST, null, null);
  var req = new SimpleRequest();
  var size = 314159;

  var payload = new Payload();
  payload.setBody('0'.repeat(271828));

  req.setPayload(payload);
  req.setResponseSize(size);

  testService.unaryCall(req, null, (err, response) => {
    assert.ifError(err);
    assert.equal(response.getPayload().getBody().length, size);
    done();
  });
}

function doServerStreaming(done) {
  var testService = new TestServiceClient(SERVER_HOST, null, null);
  var sizes = [31415, 9, 2653, 58979];

  var responseParams = sizes.map((size, idx) => {
    var param = new ResponseParameters();
    param.setSize(size);
    param.setIntervalUs(idx * 10);
    return param;
  });

  var req = new StreamingOutputCallRequest();
  req.setResponseParametersList(responseParams);

  var stream = testService.streamingOutputCall(req);

  done = multiDone(done, sizes.length);
  var numCallbacks = 0;
  stream.on('data', (response) => {
    assert.equal(response.getPayload().getBody().length, sizes[numCallbacks]);
    numCallbacks++;
    done();
  });
}

function doCustomMetadata(done) {
  var testService = new TestServiceClient(SERVER_HOST, null, null);
  done = multiDone(done, 3);

  var req = new SimpleRequest();
  const size = 314159;
  const ECHO_INITIAL_KEY = 'x-grpc-test-echo-initial';
  const ECHO_INITIAL_VALUE = 'test_initial_metadata_value';
  const ECHO_TRAILING_KEY = 'x-grpc-test-echo-trailing-bin';
  const ECHO_TRAILING_VALUE = 0xababab;

  var payload = new Payload();
  payload.setBody('0'.repeat(271828));

  req.setPayload(payload);
  req.setResponseSize(size);

  var call = testService.unaryCall(req, {
    [ECHO_INITIAL_KEY]: ECHO_INITIAL_VALUE,
    [ECHO_TRAILING_KEY]: ECHO_TRAILING_VALUE
  }, (err, response) => {
    assert.ifError(err);
    assert.equal(response.getPayload().getBody().length, size);
    done();
  });

  call.on('metadata', (metadata) => {
    assert(ECHO_INITIAL_KEY in metadata);
    assert.equal(metadata[ECHO_INITIAL_KEY], ECHO_INITIAL_VALUE);
    done();
  });

  call.on('status', (status) => {
    assert('metadata' in status);
    assert(ECHO_TRAILING_KEY in status.metadata);
    assert.equal(status.metadata[ECHO_TRAILING_KEY], ECHO_TRAILING_VALUE);
    done();
  });
}

function doStatusCodeAndMessage(done) {
  var testService = new TestServiceClient(SERVER_HOST, null, null);
  var req = new SimpleRequest();

  const TEST_STATUS_MESSAGE = 'test status message';
  const echoStatus = new EchoStatus();
  echoStatus.setCode(2);
  echoStatus.setMessage(TEST_STATUS_MESSAGE);

  req.setResponseStatus(echoStatus);

  testService.unaryCall(req, {}, (err, response) => {
    assert(err);
    assert('code' in err);
    assert('message' in err);
    assert.equal(err.code, 2);
    assert.equal(err.message, TEST_STATUS_MESSAGE);
    done();
  });
}

function doUnimplementedMethod(done) {
  var testService = new TestServiceClient(SERVER_HOST, null, null);
  testService.unimplementedCall(new Empty(), {}, (err, response) => {
    assert(err);
    assert('code' in err);
    assert.equal(err.code, 12);
    done();
  });
}


var testCases = {
  'empty_unary': {testFunc: doEmptyUnary},
  'large_unary': {testFunc: doLargeUnary},
  'server_streaming': {testFunc: doServerStreaming,
                       skipBinaryMode: true},
  'custom_metadata': {testFunc: doCustomMetadata},
  'status_code_and_message': {testFunc: doStatusCodeAndMessage},
  'unimplemented_method': {testFunc: doUnimplementedMethod}
};

if (typeof window === 'undefined') { // Running from Node
  console.log('Running from Node...');

  // Fill in XHR runtime
  global.XMLHttpRequest = require("xhr2");

  var parseArgs = require('minimist');
  var argv = parseArgs(process.argv, {
    string: ['mode']
  });
  if (argv.mode == 'binary') {
    console.log('Testing grpc-web mode (binary)...');
  } else {
    console.log('Testing grpc-web-text mode...');
  }
  
  describe('grpc-web interop tests', function() {
    Object.keys(testCases).forEach((testCase) => {
      if (argv.mode == 'binary' && testCases[testCase].skipBinaryMode) return;
      it('should pass '+testCase, testCases[testCase].testFunc);
    });
  });
} else {
  console.log('Running from browser...');

  Object.keys(testCases).forEach((testCase) => {
    var testFunc = testCases[testCase].testFunc;

    var doneCalled = false;
    testFunc((err) => {
      if (err) {
        throw err;
      } else {
        doneCalled = true;
        console.log(testCase+': passed');
      }
    });

    setTimeout(() => {
      if (!doneCalled) {
        throw testCase+': failed. Not all done() are called';
      }
    }, 500);
  });
}
