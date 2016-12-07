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
   * Serialize the proto as binary and base64-encode it
   */
  BASE64: 'BASE64',

  /**
   * Serialize the proto in JSPB wire format
   */
  JSPB: 'JSPB'
};


/**
 * @param {?jspb.Message} request The request proto
 * @return {string} serialized proto in string form
 * @private
 */
grpc.web.ClientBase.prototype.serialize_ = function(request) {
  if (this.mode_ == grpc.web.ClientBase.Mode.BINARY) {
    return /** @type {*} */ (request).serializeBinary();
  } else if (this.mode_ == grpc.web.ClientBase.Mode.BASE64) {
    return goog.crypt.base64.encodeByteArray(
      /** @type {*} */ (request).serializeBinary());
  } else {
    return request.serialize();
  }
};


/**
 * @param {!string} method The method to invoke
 * @param {!jspb.Message} request The request proto
 * @param {!Object<string, string>} metadata User defined call metadata
 * @param {function(?):!jspb.Message} deserializeFunc
 *   The deserialize function for the proto
 * @param {function(?string, (?Object|undefined))} callback A callback
 * function which takes (error, response)
 * @return {!grpc.web.ClientReadableStream|undefined} The Client Readable
 *   Stream
 */
grpc.web.ClientBase.prototype.rpcCall = function(
    method, request, metadata, deserializeFunc, callback) {
  var xhr = this.newXhr_();
  var serialized = this.serialize_(request);

  xhr.headers.addAll(metadata);

  // TODO(updogliu): Decompose this large if-else statement.
  if (this.mode_ == grpc.web.ClientBase.Mode.BINARY) {
    var isB64EncodedResponse =
        xhr.headers.get('X-Goog-Encode-Response-If-Executable') == 'base64';
    if (isB64EncodedResponse) {
      xhr.setWithCredentials(true);
    }
    goog.events.listen(xhr, goog.net.EventType.COMPLETE, function(e) {
      var response = null;
      var err = null;  // TODO: propagate error for ByteSource response
      if (xhr.isSuccess()) {
        /** @type {?jspb.ByteSource} */ var byteSource;
        if (isB64EncodedResponse &&
            xhr.getResponseHeader('X-Goog-Safety-Encoding') == 'base64') {
          // Convert the response's ArrayBuffer to a string, which should
          // be a base64 encoded string.
          var bytes = new Uint8Array(
              /** @type {?ArrayBuffer} */ (xhr.getResponse()));
          byteSource = '';
          for (var i = 0; i < bytes.length; i++) {
            byteSource += String.fromCharCode(bytes[i]);
          }
        } else {
          byteSource = /** @type {?jspb.ByteSource} */ (xhr.getResponse());
        }
        if (xhr.isSuccess()) {
          response = deserializeFunc(byteSource);
        }
      } else if (xhr.getResponse() instanceof ArrayBuffer) {
        var bytes = new Uint8Array(
            /** @type {?ArrayBuffer} */ (xhr.getResponse()));
        err = '';
        for (var i = 0; i < bytes.length; i++) {
          err += String.fromCharCode(bytes[i]);
        }
      }
      callback(err, response);
    });

    xhr.headers.set('Content-Type', 'application/x-protobuf');
    xhr.setResponseType(goog.net.XhrIo.ResponseType.ARRAY_BUFFER);
    xhr.send(method, 'POST', serialized);
    return;
  } else if (this.mode_ == grpc.web.ClientBase.Mode.BASE64) {
    var stream = this.getClientReadableStream_(xhr, deserializeFunc);

    stream.on('data', function(response) {
      var err = null; // TODO: propagate error
      callback(err, response);
    });

    xhr.headers.set('Content-Type', 'application/x-protobuf');
    xhr.headers.set('Content-Transfer-Encoding', 'base64');
    xhr.send(method, 'POST', serialized);
    return stream;
  } else if (this.mode_ == grpc.web.ClientBase.Mode.JSPB) {
    goog.events.listen(xhr, goog.net.EventType.COMPLETE, function(e) {
      var response = null;
      if (xhr.isSuccess()) {
        response = deserializeFunc(xhr.getResponseText());
      }
      var err = null; // TODO: propagate error
      callback(err, response);
    });

    xhr.headers.set('Content-Type', 'application/json+protobuf');
    xhr.send(method, 'POST', serialized);
    return;
  } else {
    throw new Error('Invalid gRPC-Web mode: ' + this.mode_);
  }
};


/**
 * @param {!string} method The method to invoke
 * @param {!jspb.Message} request The request proto
 * @param {!Object<string, string>} metadata User defined call metadata
 * @param {function(?):!jspb.Message} deserializeFunc
 *   The deserialize function for the proto
 * @return {!grpc.web.ClientReadableStream} The Client Readable Stream
 */
grpc.web.ClientBase.prototype.serverStreaming = function(
    method, request, metadata, deserializeFunc) {
  var xhr = this.newXhr_();
  var stream = this.getClientReadableStream_(xhr, deserializeFunc);

  xhr.headers.addAll(metadata);

  var serialized = this.serialize_(request);
  xhr.headers.set('Content-Type', 'application/x-protobuf');
  xhr.headers.set('Content-Transfer-Encoding', 'base64');
  xhr.send(method, 'POST', serialized);

  return stream;
};


/**
 * Create a new XhrIo object
 *
 * @private
 * @return {!goog.net.XhrIo} The created XhrIo object
 */
grpc.web.ClientBase.prototype.newXhr_ = function() {
  return new goog.net.XhrIo();
};


/**
 * @private
 * @param {!goog.net.XhrIo} xhr The XhrIo object
 * @param {function(?):!jspb.Message} deserializeFunc
 *   The deserialize function for the proto
 * @return {!grpc.web.ClientReadableStream} The Client Readable Stream
 */
grpc.web.ClientBase.prototype.getClientReadableStream_ = function(
    xhr, deserializeFunc) {
  return new grpc.web.ClientReadableStream(xhr, deserializeFunc);
}
