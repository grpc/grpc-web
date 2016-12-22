/**
 * @fileoverview gRPC browser client library.
 *
 * Base class for gRPC Web JS clients to be used with the gRPC Gateway
 *
 * @author stanleycheung@google.com (Stanley Cheung)
 */
goog.provide('grpc.web.GatewayClientBase');


goog.require('goog.crypt.base64');
goog.require('goog.net.XhrIo');
goog.require('grpc.web.ClientReadableStream');



/**
 * Base class for gRPC web client (gRPC Gateway)
 * @constructor
 */
grpc.web.GatewayClientBase = function() {
};


/**
 * @param {?jspb.Message} request The request proto
 * @return {string} serialized proto in string form
 * @private
 */
grpc.web.GatewayClientBase.prototype.serialize_ = function(request) {
  return goog.crypt.base64.encodeByteArray(
    /** @type {*} */ (request).serializeBinary());
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
grpc.web.GatewayClientBase.prototype.rpcCall = function(
    method, request, metadata, deserializeFunc, callback) {
  var xhr = this.newXhr_();
  var serialized = this.serialize_(request);

  xhr.headers.addAll(metadata);

  var stream = this.getClientReadableStream_(xhr, deserializeFunc);

  stream.on('data', function(response) {
    var err = null; // TODO: propagate error
    callback(err, response);
  });

  xhr.headers.set('Content-Type', 'application/x-protobuf');
  xhr.headers.set('Content-Transfer-Encoding', 'base64');
  xhr.send(method, 'POST', serialized);
  return stream;
};


/**
 * @param {!string} method The method to invoke
 * @param {!jspb.Message} request The request proto
 * @param {!Object<string, string>} metadata User defined call metadata
 * @param {function(?):!jspb.Message} deserializeFunc
 *   The deserialize function for the proto
 * @return {!grpc.web.ClientReadableStream} The Client Readable Stream
 */
grpc.web.GatewayClientBase.prototype.serverStreaming = function(
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
grpc.web.GatewayClientBase.prototype.newXhr_ = function() {
  return new goog.net.XhrIo();
};


/**
 * @private
 * @param {!goog.net.XhrIo} xhr The XhrIo object
 * @param {function(?):!jspb.Message} deserializeFunc
 *   The deserialize function for the proto
 * @return {!grpc.web.ClientReadableStream} The Client Readable Stream
 */
grpc.web.GatewayClientBase.prototype.getClientReadableStream_ = function(
    xhr, deserializeFunc) {
  return new grpc.web.ClientReadableStream(xhr, deserializeFunc);
};
