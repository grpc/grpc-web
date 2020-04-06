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
const grpc = {};
grpc.web = require('grpc-web');

var testService = new TestServiceClient(
  'http://'+window.location.hostname+':8080', null, null);

function doEmptyUnary() {
  return new Promise((resolve, reject) => {
    testService.emptyCall(new Empty(), null, (err, response) => {
      if (err) {
        reject('EmptyUnary failed: Received unexpected error "'+
               err.message+'"');
        return;
      } else {
        if (!(response instanceof Empty)) {
          reject('EmptyUnary failed: Response not of Empty type');
          return;
        }
        resolve('EmptyUnary: passed');
      }
    });
  });
}

function doLargeUnary() {
  return new Promise((resolve, reject) => {
    var req = new SimpleRequest();
    var size = 314159;

    var payload = new Payload();
    payload.setBody('0'.repeat(271828));

    req.setPayload(payload);
    req.setResponseSize(size);

    testService.unaryCall(req, null, (err, response) => {
      if (err) {
        reject('LargeUnary failed: Received unexpected error "'+
               err.message+'"');
        return;
      } else {
        if (response.getPayload().getBody().length != size) {
          rejecet('LargeUnary failed: Received incorrect size payload');
          return;
        }
        resolve('LargeUnary: passed');
      }
    });
  });
}

function doServerStreaming() {
  return new Promise((resolve, reject) => {
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

    var numCallbacks = 0;
    stream.on('data', (response) => {
      if (response.getPayload().getBody().length != sizes[numCallbacks]) {
        reject('ServerStreaming failed: Received incorrect size payload');
        return;
      }
      numCallbacks++;
    });
    // TODO(stanleycheung): is there a better way to do this?
    setTimeout(() => {
      if (numCallbacks != sizes.length) {
        reject('ServerStreaming failed: data callback called '+
               numCallbacks+' times. Should be '+sizes.length);
        return;
      }
      resolve('ServerStreaming: passed');
    }, 200);
  });
}

function doCustomMetadata() {
  return new Promise((resolve, reject) => {
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
      if (err) {
        reject('CustomMetadata failed: Received unexpected error "'+
               err.message+'"');
        return;
      } else {
        if (response.getPayload().getBody().length != size) {
          rejecet('CustomMetadata failed: Received incorrect size payload');
          return;
        }
      }
    });
    var metadataCallbackVerified = false;
    var statusCallbackVerified = false;
    call.on('metadata', (metadata) => {
      if (!(ECHO_INITIAL_KEY in metadata)) {
        reject('CustomMetadata failed: initial metadata does not '+
               'contain '+ECHO_INITIAL_KEY);
      } else if (metadata[ECHO_INITIAL_KEY] != ECHO_INITIAL_VALUE) {
        reject('CustomMetadata failed: initial metadata value for '+
               ECHO_INITIAL_KEY+' is incorrect');
      } else {
        metadataCallbackVerified = true;
      }
    });
    call.on('status', (status) => {
      if (!('metadata' in status)) {
        reject('CustomMetadata failed: status callback does not '+
               'contain metadata');
      } else if (!(ECHO_TRAILING_KEY in status.metadata)) {
        reject('CustomMetadata failed: trailing metadata does not '+
               'contain '+ECHO_TRAILING_KEY);
      } else if (status.metadata[ECHO_TRAILING_KEY] != ECHO_TRAILING_VALUE) {
        reject('CustomMetadata failed: trailing metadata value for '+
               ECHO_TRAILING_KEY+' is incorrect');
      } else {
        statusCallbackVerified = true;
      }
    });
    setTimeout(() => {
      if (!metadataCallbackVerified || !statusCallbackVerified) {
        reject('CustomMetadata failed: some callback failed to verify');
      }
      resolve('CustomMetadta passed');
    }, 200);
  });
}

function doStatusCodeAndMessage() {
  return new Promise((resolve, reject) => {
    var req = new SimpleRequest();

    const TEST_STATUS_MESSAGE = 'test status message';
    const echoStatus = new EchoStatus();
    echoStatus.setCode(2);
    echoStatus.setMessage(TEST_STATUS_MESSAGE);
    
    req.setResponseStatus(echoStatus);

    testService.unaryCall(req, {}, (err, response) => {
      if (err) {
        if (!('code' in err)) {
          reject('StatusCodeAndMessage failed: status callback does not '+
                 'contain code');
        } else if (!('message' in err)) {
          reject('StatusCodeAndMessage failed: status callback does not '+
                 'contain message');
        } else if (err.code != 2) {
          reject('StatusCodeAndMessage failed: status code is not 2, is '+
                 err.code);
        } else if (err.message != TEST_STATUS_MESSAGE) {
          reject('StatusCodeAndMessage failed: status mesage is not '+
                 TEST_STATUS_MESSAGE+', is '+err.message);
        } else {
          resolve('StatusCodeAndMessage passed');
        }
      } else {
        reject('StatusCodeAndMessage failed: should not have received a '+
               'proper response');
      }
    });
  });
}

function doUnimplementedMethod() {
  return new Promise((resolve, reject) => {
    testService.unimplementedCall(new Empty(), {}, (err, response) => {
      if (err) {
        if (!('code' in err)) {
          reject('UnimplementedMethod failed: status callback does not '+
                 'contain code');
        } else if (!('message' in err)) {
          reject('UnimplementedMethod failed: status callback does not '+
                 'contain message');
        } else if (err.code != 12) {
          reject('UnimplementedMethod failed: status code is not 12'+
                 '(UNIMPLEMENTED), is '+ err.code);
        } else {
          resolve('UnimplementedMethod passed');
        }
      } else {
        reject('UnimplementedMethod failed: should not have received a '+
               'proper respoonse');
      }
    });
  });
}
      

var testCases = [doEmptyUnary, doLargeUnary, doServerStreaming,
                 doCustomMetadata, doStatusCodeAndMessage,
                 doUnimplementedMethod];

testCases.reduce((promiseChain, currentTask) => {
  return promiseChain.then(() => {
    return currentTask().then(console.log);
  }).catch(console.error);
}, Promise.resolve());
