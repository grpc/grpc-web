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

var PROTO_PATH = __dirname + '/helloworld.proto';

var grpc = require('grpc');
var _ = require('lodash');
var async = require('async');
var protoLoader = require('@grpc/proto-loader');
var packageDefinition = protoLoader.loadSync(
    PROTO_PATH,
    {keepCase: true,
     longs: String,
     enums: String,
     defaults: true,
     oneofs: true
    });
var protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
var helloworld = protoDescriptor.helloworld;

/**
 * @param {!Object} call
 * @param {function():?} callback
 */
function doSayHello(call, callback) {
  callback(null, {message: 'Hello! '+ call.request.name});
}

/**
 * @param {!Object} call
 */
function doSayRepeatHello(call) {
  var senders = [];
  function sender(name, interval, messageSize) {
    return (callback) => {
      var message = ('Y'.repeat(1024)).repeat(messageSize);
      console.log('name, interval, messageSize', name, interval, messageSize);
      console.log('message.length', message.length);

      call.write({
        message: message,
      });
      _.delay(callback, interval); // in ms
    };
  }
  console.log('call.request', call.request);
  for (var i = 0; i < call.request.count; i++) {
    senders[i] = sender(call.request.name + i, call.request.interval, call.request.message_size);
  }
  async.series(senders, () => {
    console.log('end');
    call.end();
  });
}

/**
 * @param {!Object} call
 * @param {function():?} callback
 */
function doSayHelloAfterDelay(call, callback) {
  function dummy() {
    return (cb) => {
      _.delay(cb, 5000);
    };
  }
  async.series([dummy()], () => {
    callback(null, {
      message: 'Hello! '+call.request.name
    });
  });
}

/**
 * @return {!Object} gRPC server
 */
function getServer() {
  var server = new grpc.Server();
  server.addService(helloworld.Greeter.service, {
    sayHello: doSayHello,
    sayRepeatHello: doSayRepeatHello,
    sayHelloAfterDelay: doSayHelloAfterDelay
  });
  return server;
}

if (require.main === module) {
  var server = getServer();
  server.bind('0.0.0.0:9090', grpc.ServerCredentials.createInsecure());
  server.start();
}

exports.getServer = getServer;
