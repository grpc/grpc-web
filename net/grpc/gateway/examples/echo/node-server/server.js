/*
 *
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

var PROTO_PATH = __dirname + '/../echo.proto';

var assert = require('assert');
var async = require('async');
var _ = require('lodash');
var grpc = require('@grpc/grpc-js');
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
var echo = protoDescriptor.grpc.gateway.testing;

/**
 * @param {!Object} call
 * @return {!Object} metadata
 */
function copyMetadata(call) {
  var metadata = call.metadata.getMap();
  var response_metadata = new grpc.Metadata();
  for (var key in metadata) {
    response_metadata.set(key, metadata[key]);
  }
  return response_metadata;
}

/**
 * @param {!Object} call
 * @param {function():?} callback
 */
function doEcho(call, callback) {
  callback(null, {
    message: call.request.message
  }, copyMetadata(call));
}

/**
 * @param {!Object} call
 * @param {function():?} callback
 */
function doEchoAbort(call, callback) {
  callback({
    code: grpc.status.ABORTED,
    message: 'Aborted from server side.'
  });
}

/**
 * @param {!Object} call
 */
function doServerStreamingEcho(call) {
  var senders = [];
  function sender(message, interval) {
    return (callback) => {
      call.write({
        message: message
      });
      _.delay(callback, interval);
    };
  }
  for (var i = 0; i < call.request.message_count; i++) {
    senders[i] = sender(call.request.message, call.request.message_interval);
  }
  async.series(senders, () => {
    call.end(copyMetadata(call));
  });
}

/**
 * Get a new server with the handler functions in this file bound to the
 * methods it serves.
 * @return {!Server} The new server object
 */
function getServer() {
  var server = new grpc.Server();
  server.addService(echo.EchoService.service, {
    echo: doEcho,
    echoAbort: doEchoAbort,
    serverStreamingEcho: doServerStreamingEcho,
  });
  return server;
}

if (require.main === module) {
  // If this is run as a script, start a server on an unused port
  var echoServer = getServer();
  echoServer.bindAsync(
      '0.0.0.0:9090', grpc.ServerCredentials.createInsecure(), (err, port) => {
        assert.ifError(err);
        echoServer.start();
      });
}

exports.getServer = getServer;
