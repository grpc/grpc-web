/**
 * @fileoverview gRPC browser client library.
 *
 * Base class for gRPC Web JS clients using the application/grpc-web wire
 * format
 *
 * @author stanleycheung@google.com (Stanley Cheung)
 */
goog.provide('grpc.web.GrpcWebClientBase');


goog.require('goog.crypt.base64');
goog.require('goog.net.XhrIo');
goog.require('grpc.web.AbstractClientBase');
goog.require('grpc.web.GrpcWebClientReadableStream');
goog.require('grpc.web.StatusCode');


/**
 * Base class for gRPC web client using the application/grpc-web wire format
 * @param {?Object=} opt_options
 * @constructor
 * @implements {grpc.web.AbstractClientBase}
 */
grpc.web.GrpcWebClientBase = function(opt_options) {
};


/**
 * @override
 */
grpc.web.GrpcWebClientBase.prototype.rpcCall = function(
    method, request, metadata, methodInfo, callback) {
  var xhr = this.newXhr_();
  var serialized = methodInfo.requestSerializeFn(request);
  xhr.headers.addAll(metadata);

  var stream = new grpc.web.GrpcWebClientReadableStream(xhr);
  stream.setResponseDeserializeFn(methodInfo.responseDeserializeFn);

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

  xhr.headers.set('Content-Type', 'application/grpc-web-text');
  xhr.headers.set('Accept', 'application/grpc-web-text');

  var payload = this.encodeRequest_(serialized);
  payload = goog.crypt.base64.encodeByteArray(payload);
  xhr.send(method, 'POST', payload);
  return;
};


/**
 * @override
 */
grpc.web.GrpcWebClientBase.prototype.serverStreaming = function(
    method, request, metadata, methodInfo) {
  var xhr = this.newXhr_();
  var serialized = methodInfo.requestSerializeFn(request);
  xhr.headers.addAll(metadata);

  var stream = new grpc.web.GrpcWebClientReadableStream(xhr);
  stream.setResponseDeserializeFn(methodInfo.responseDeserializeFn);

  xhr.headers.set('Content-Type', 'application/grpc-web-text');
  xhr.headers.set('Accept', 'application/grpc-web-text');

  var payload = this.encodeRequest_(serialized);
  payload = goog.crypt.base64.encodeByteArray(payload);
  xhr.send(method, 'POST', payload);

  return stream;
};


/**
 * Create a new XhrIo object
 *
 * @private
 * @return {!goog.net.XhrIo} The created XhrIo object
 */
grpc.web.GrpcWebClientBase.prototype.newXhr_ = function() {
  return new goog.net.XhrIo();
};



/**
 * Encode the grpc-web request
 *
 * @private
 * @param {!Uint8Array} serialized The serialized proto payload
 * @return {!Uint8Array} The application/grpc-web padded request
 */
grpc.web.GrpcWebClientBase.prototype.encodeRequest_ = function(serialized) {
  var len = serialized.length;
  var bytesArray = [0, 0, 0, 0];
  var payload = new Uint8Array(5 + len);
  for (var i = 3; i >= 0; i--) {
    bytesArray[i] = (len % 256);
    len = len >>> 8;
  }
  payload.set(new Uint8Array(bytesArray), 1);
  payload.set(serialized, 5);
  return payload;
};
