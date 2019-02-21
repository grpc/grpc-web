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
/**
 * @fileoverview gRPC browser client library.
 *
 * Base class for gRPC Web JS clients to be used with the gRPC Gateway
 *
 * @author stanleycheung@google.com (Stanley Cheung)
 */
goog.module('grpc.web.GatewayClientBase');

goog.module.declareLegacyNamespace();


const AbstractClientBase = goog.require('grpc.web.AbstractClientBase');
const ClientReadableStream = goog.require('grpc.web.ClientReadableStream');
const GoogleRpcStatus = goog.require('proto.google.rpc.Status');
const NodeReadableStream = goog.require('goog.net.streams.NodeReadableStream');
const Pair = goog.require('proto.grpc.gateway.Pair');
const StatusCode = goog.require('grpc.web.StatusCode');
const StreamBodyClientReadableStream = goog.require('grpc.web.StreamBodyClientReadableStream');
const XhrIo = goog.require('goog.net.XhrIo');
const createXhrNodeReadableStream = goog.require('goog.net.streams.createXhrNodeReadableStream');
const googCrypt = goog.require('goog.crypt');
const {Status} = goog.require('grpc.web.Status');



/**
 * Base class for gRPC web client (gRPC Gateway)
 * @param {?Object=} opt_options
 * @constructor
 * @implements {AbstractClientBase}
 */
const GatewayClientBase = function(opt_options) {
};


/**
 * @override
 */
GatewayClientBase.prototype.rpcCall = function(
    method, request, metadata, methodInfo, callback) {
  var xhr = this.newXhr_();
  var serialized = methodInfo.requestSerializeFn(request);

  xhr.headers.addAll(metadata);

  var stream = this.createClientReadableStream_(
      xhr,
      methodInfo.responseDeserializeFn);

  stream.on('data', function(response) {
    callback(null, response);
  });

  stream.on('status', function(status) {
    if (status.code != StatusCode.OK) {
      callback({
        'code': status.code,
        'message': status.details
      }, null);
    }
  });

  xhr.headers.set('Content-Type', 'application/x-protobuf');
  xhr.headers.set('X-User-Agent', 'grpc-web-javascript/0.1');
  xhr.headers.set('X-Accept-Content-Transfer-Encoding', 'base64');
  xhr.headers.set('X-Accept-Response-Streaming', 'true');

  xhr.send(method, 'POST', serialized);
  return stream;
};


/**
 * @override
 */
GatewayClientBase.prototype.unaryCall = function(
    method, request, metadata, methodInfo) {
  return new Promise((resolve, reject) => {
    this.rpcCall(method, request, metadata, methodInfo, (error, response) => {
      error ? reject(error) : resolve(response);
    });
  });
};


/**
 * @override
 */
GatewayClientBase.prototype.serverStreaming = function(
    method, request, metadata, methodInfo) {
  var xhr = this.newXhr_();
  var serialized = methodInfo.requestSerializeFn(request);

  xhr.headers.addAll(metadata);

  var stream = this.createClientReadableStream_(
      xhr,
      methodInfo.responseDeserializeFn);

  xhr.headers.set('Content-Type', 'application/x-protobuf');
  xhr.headers.set('X-User-Agent', 'grpc-web-javascript/0.1');
  xhr.headers.set('X-Accept-Content-Transfer-Encoding', 'base64');
  xhr.headers.set('X-Accept-Response-Streaming', 'true');

  xhr.send(method, 'POST', serialized);
  return stream;
};


/**
 * Create a new XhrIo object
 *
 * @private
 * @return {!XhrIo} The created XhrIo object
 */
GatewayClientBase.prototype.newXhr_ = function() {
  return new XhrIo();
};


/**
 * Create a new XhrNodeReadableStream object
 *
 * @private
 * @param {!XhrIo} xhr The XhrIo object
 * @return {?NodeReadableStream} The XHR NodeReadableStream object
 */
GatewayClientBase.prototype.newXhrNodeReadableStream_ = function(xhr) {
  return createXhrNodeReadableStream(xhr);
};


/**
 * @template RESPONSE
 * @private
 * @param {!XhrIo} xhr The XhrIo object
 * @param {function(?):!RESPONSE} responseDeserializeFn
 *   The deserialize function for the proto
 * @return {!ClientReadableStream<RESPONSE>} The Client Readable Stream
 */
GatewayClientBase.prototype.createClientReadableStream_ = function(
  xhr, responseDeserializeFn) {
  var xhrNodeReadableStream = this.newXhrNodeReadableStream_(xhr);
  var genericTransportInterface = {
    xhr: xhr,
    nodeReadableStream: xhrNodeReadableStream,
  };
  var stream = new StreamBodyClientReadableStream(genericTransportInterface);
  stream.setResponseDeserializeFn(responseDeserializeFn);
  stream.setRpcStatusParseFn(GatewayClientBase.parseRpcStatus_);
  return stream;
};


/**
 * @private
 * @static
 * @param {!Uint8Array} data Data returned from underlying stream
 * @return {!Status} status The Rpc Status details
 */
GatewayClientBase.parseRpcStatus_ = function(data) {
  var rpcStatus = GoogleRpcStatus.deserializeBinary(data);
  var metadata = {};
  var details = rpcStatus.getDetailsList();
  for (var i = 0; i < details.length; i++) {
    var pair = Pair.deserializeBinary(
      details[i].getValue());
    var first = googCrypt.utf8ByteArrayToString(
      pair.getFirst_asU8());
    var second = googCrypt.utf8ByteArrayToString(
      pair.getSecond_asU8());
    metadata[first] = second;
  }
  var status = {
    code: rpcStatus.getCode(),
    details: rpcStatus.getMessage(),
    metadata: metadata
  };
  return status;
};


exports = GatewayClientBase;
