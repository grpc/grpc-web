/**
 * @fileoverview gRPC browser client library.
 *
 * Future use case for this class is for protoc codegen plugin to generate
 * gRPC JS browser client stub classes.
 *
 * Currently only basic unary RPC and server streaming call are supported.
 *
 * @author stanleycheung@google.com (Stanley Cheung)
 */
goog.provide('grpc.web.ClientBase');


goog.require('goog.crypt.base64');
goog.require('goog.events');
goog.require('goog.net.XhrIo');
goog.require('goog.net.streams.createXhrNodeReadableStream');
goog.require('grpc.web.ClientReadableStream');



/**
 * Base class for all gRPC web clients.
 * @param {!string} mode Decides how proto is serialized on the wire.
 * @constructor
 */
grpc.web.ClientBase = function(mode) {
  /**
   * @private {!string} decides how proto is serialized on the wire.
   */
  this.mode_ = mode;
};


/**
 * Enum type for mode
 * @enum {string}
 */
grpc.web.ClientBase.Mode = {
  /**
   * Serialize the proto as binary
   */
  BINARY: 'BINARY',

  /**
   * Serialize the proto as a json representation of the base64-encoded
   * binary proto
   */
  BASE64: 'BASE64'
};


/**
 * @param {?jspb.Message} request The request proto
 * @return {string} serialized proto in string form
 * @private
 */
grpc.web.ClientBase.prototype.serialize_ = function(request) {
  if (this.mode_ == grpc.web.ClientBase.Mode.BINARY) {
    return /** @type {*} */ (request).serializeBinary();
  } else {
    var base64 = goog.crypt.base64.encodeByteArray(
        /** @type {*} */ (request).serializeBinary());
    return '[{"1":"' + base64 + '"}]';
  }
};


/**
 * @param {!string} method The method to invoke
 * @param {!jspb.Message} request The request proto
 * @param {!Object<string, string>} metadata User defined call metadata
 * @param {function(?jspb.ByteSource):!jspb.Message} deserializeFunc
 *   The deserialize function for the proto
 * @param {function(?Object, (?Object|undefined))} callback A callback
 * function which takes (error, response)
 * @return {!grpc.web.ClientReadableStream|undefined} The Client Readable
 *   Stream
 */
grpc.web.ClientBase.prototype.rpcCall = function(
    method, request, metadata, deserializeFunc, callback) {
  var xhr = this.getXhr_();
  var serialized = this.serialize_(request);

  xhr.headers.addAll(metadata);

  if (this.mode_ == grpc.web.ClientBase.Mode.BINARY) {
    var isB64EncodedResponse =
        xhr.headers.get('X-Goog-Encode-Response-If-Executable') == 'base64';
    if (isB64EncodedResponse) {
      xhr.setWithCredentials(true);
    }
    goog.events.listen(xhr, goog.net.EventType.COMPLETE, function(e) {
      var response = null;
      if (xhr.isSuccess()) {
        /** @type {?jspb.ByteSource} */ var byteSource;
        if (isB64EncodedResponse &&
            xhr.getResponseHeader('X-Goog-Safety-Encoding') == 'base64') {
          // Convert the response's ArrayBuffer to a string, which should
          // be a base64 encoded string.
          byteSource = String.fromCharCode.apply(null,
              new Uint8Array(/** @type {?ArrayBuffer} */ (xhr.getResponse())));
        } else {
          byteSource = /** @type {?jspb.ByteSource} */ (xhr.getResponse());
        }
        response = deserializeFunc(byteSource);
      }
      var err = null; // TODO: propagate error
      callback(err, response);
    });

    xhr.headers.set('Content-Type', 'application/x-protobuf');
    xhr.setResponseType(goog.net.XhrIo.ResponseType.ARRAY_BUFFER);
    xhr.send(method, 'POST', serialized);
  } else {
    var stream = this.getClientReadableStream_(xhr, deserializeFunc);

    stream.on('data', function(response) {
      var err = null; // TODO: propagate error
      callback(err, response);
    });

    xhr.headers.set('Content-Type', 'application/json');
    xhr.send(method, 'POST', serialized);

    return stream;
  }
};


/**
 * @param {!string} method The method to invoke
 * @param {!jspb.Message} request The request proto
 * @param {!Object<string, string>} metadata User defined call metadata
 * @param {function(?jspb.ByteSource):!jspb.Message} deserializeFunc
 *   The deserialize function for the proto
 * @return {!grpc.web.ClientReadableStream} The Client Readable Stream
 */
grpc.web.ClientBase.prototype.serverStreaming = function(
    method, request, metadata, deserializeFunc) {
  var xhr = this.getXhr_();
  var stream = this.getClientReadableStream_(xhr, deserializeFunc);

  xhr.headers.addAll(metadata);

  var serialized = this.serialize_(request);
  xhr.headers.set('Content-Type', 'application/json');
  xhr.send(method, 'POST', serialized);

  return stream;
};


/**
 * @private
 * @return {!goog.net.XhrIo} The XhrIo object
 */
grpc.web.ClientBase.prototype.getXhr_ = function() {
  return new goog.net.XhrIo();
};


/**
 * @private
 * @param {!goog.net.XhrIo} xhr The XhrIo object
 * @param {function(?jspb.ByteSource):!jspb.Message} dfunc
 *   The deserialize function for the proto
 * @return {!grpc.web.ClientReadableStream} The Client Readable Stream
 */
grpc.web.ClientBase.prototype.getClientReadableStream_ = function(
    xhr, dfunc) {
  var xhrStream = goog.net.streams.createXhrNodeReadableStream(xhr);
  return new grpc.web.ClientReadableStream(xhrStream, dfunc);
}
