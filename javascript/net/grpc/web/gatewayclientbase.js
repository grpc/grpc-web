/**
 * @fileoverview gRPC browser client library.
 *
 * Base class for gRPC Web JS clients to be used with the gRPC Gateway
 *
 * @author stanleycheung@google.com (Stanley Cheung)
 */
goog.provide('grpc.web.GatewayClientBase');


goog.require('goog.crypt');
goog.require('goog.net.XhrIo');
goog.require('grpc.web.AbstractClientBase');
goog.require('grpc.web.ClientReadableStream');
goog.require('grpc.web.Status');
goog.require('grpc.web.StatusCode');
goog.require('proto.google.rpc.Status');
goog.require('proto.grpc.gateway.Pair');



/**
 * Base class for gRPC web client (gRPC Gateway)
 * @param {?Object=} opt_options
 * @constructor
 * @implements {grpc.web.AbstractClientBase}
 */
grpc.web.GatewayClientBase = function(opt_options) {
};


/**
 * @override
 */
grpc.web.GatewayClientBase.prototype.rpcCall = function(
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
    if (status.code != grpc.web.StatusCode.OK) {
      callback({
        'code': status.code,
        'message': status.details
      }, null);
    }
  });

  xhr.headers.set('Content-Type', 'application/x-protobuf');
  xhr.headers.set('X-Accept-Content-Transfer-Encoding', 'base64');
  xhr.headers.set('X-Accept-Response-Streaming', 'true');

  xhr.send(method, 'POST', serialized);
  return stream;
};


/**
 * @override
 */
grpc.web.GatewayClientBase.prototype.serverStreaming = function(
    method, request, metadata, methodInfo) {
  var xhr = this.newXhr_();
  var serialized = methodInfo.requestSerializeFn(request);

  xhr.headers.addAll(metadata);

  var stream = this.createClientReadableStream_(
      xhr,
      methodInfo.responseDeserializeFn);

  xhr.headers.set('Content-Type', 'application/x-protobuf');
  xhr.headers.set('X-Accept-Content-Transfer-Encoding', 'base64');
  xhr.headers.set('X-Accept-Response-Streaming', 'true');

  xhr.send(method, 'POST', serialized);
  return stream;
};


/**
 * Create a new XhrIo object
 *
 * @private
 * @return {!goog.net.XhrIo} The created XhrIo object
 */
grpc.web.GatewayClientBase.prototype.newXhr_ = function() {
  return new goog.net.XhrIo();
};


/**
 * @template RESPONSE
 * @private
 * @param {!goog.net.XhrIo} xhr The XhrIo object
 * @param {function(?):!RESPONSE} responseDeserializeFn
 *   The deserialize function for the proto
 * @return {!grpc.web.ClientReadableStream<RESPONSE>} The Client Readable Stream
 */
grpc.web.GatewayClientBase.prototype.createClientReadableStream_ = function(
    xhr, responseDeserializeFn) {
  return new grpc.web.ClientReadableStream(xhr, responseDeserializeFn,
      grpc.web.GatewayClientBase.parseRpcStatus_);
};


/**
 * @private
 * @static
 * @param {!Uint8Array} data Data returned from underlying stream
 * @return {!grpc.web.Status} status The Rpc Status details
 */
grpc.web.GatewayClientBase.parseRpcStatus_ = function(data) {
  var rpcStatus = proto.google.rpc.Status.deserializeBinary(data);
  var metadata = {};
  var details = rpcStatus.getDetailsList();
  for (var i = 0; i < details.length; i++) {
    var pair = proto.grpc.gateway.Pair.deserializeBinary(
      details[i].getValue());
    var first = goog.crypt.utf8ByteArrayToString(
      pair.getFirst_asU8());
    var second = goog.crypt.utf8ByteArrayToString(
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
