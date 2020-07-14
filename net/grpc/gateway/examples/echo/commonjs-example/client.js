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

const {EchoRequest,
       ServerStreamingEchoRequest} = require('./echo_pb.js');
const {EchoServiceClient} = require('./echo_grpc_web_pb.js');
const {EchoApp} = require('../echoapp.js');
const grpc = {};
grpc.web = require('grpc-web');

/** Sample interceptor implementation */
const StreamResponseInterceptor = function() {};

/**
 * @template REQUEST, RESPONSE
 * @param {!Request<REQUEST, RESPONSE>} request
 * @param {function(!Request<REQUEST,RESPONSE>):!ClientReadableStream<RESPONSE>}
 *     invoker
 * @return {!ClientReadableStream<RESPONSE>}
 */
StreamResponseInterceptor.prototype.intercept = function(request, invoker) {
  const InterceptedStream = function(stream) {
    this.stream = stream;
  };
  InterceptedStream.prototype.on = function(eventType, callback) {
    if (eventType == 'data') {
      const newCallback = (response) => {
        response.setMessage('[Intcpt Resp1]'+response.getMessage());
        callback(response);
      };
      this.stream.on(eventType, newCallback);
    } else {
      this.stream.on(eventType, callback);
    }
    return this;
  };
  var reqMsg = request.getRequestMessage();
  reqMsg.setMessage('[Intcpt Req1]'+reqMsg.getMessage());
  return new InterceptedStream(invoker(request));
};

var opts = {'streamInterceptors' : [new StreamResponseInterceptor()]};
var echoService = new EchoServiceClient('http://'+window.location.hostname+':8080', null,
                                        null);
//                                      opts);

var echoApp = new EchoApp(
  echoService,
  {
    EchoRequest: EchoRequest,
    ServerStreamingEchoRequest: ServerStreamingEchoRequest
  }
);

echoApp.load();
