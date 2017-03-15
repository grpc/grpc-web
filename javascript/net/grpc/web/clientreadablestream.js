/**
 * @fileoverview gRPC web client Readable Stream
 *
 * This class is being returned after a gRPC streaming call has been
 * started. This class provides functionality for user to operates on
 * the stream, e.g. set onData callback, etc.
 *
 * This wraps the underlying goog.net.streams.NodeReadableStream
 *
 * @author stanleycheung@google.com (Stanley Cheung)
 */
goog.provide('grpc.web.ClientReadableStream');


goog.require('goog.net.XhrIo');
goog.require('goog.net.streams.NodeReadableStream');
goog.require('goog.net.streams.createXhrNodeReadableStream');
goog.require('grpc.web.Status');



/**
 * A stream that the client can read from. Used for calls that are streaming
 * from the server side.
 *
 * @template RESPONSE
 * @constructor
 * @final
 * @param {!goog.net.XhrIo} xhr The XhrIo object
 * @param {function(?):!RESPONSE} responseDeserializeFn
 *   The deserialize function for the proto
 * @param {function(?):!grpc.web.Status}
 *   rpcStatusParseFn A function to parse the Rpc status response
 */
grpc.web.ClientReadableStream = function(
    xhr, responseDeserializeFn, rpcStatusParseFn) {
  /**
   * @private
   * @type {?goog.net.streams.NodeReadableStream} The XHR Node Readable
   *   Stream
   */
  this.xhrNodeReadableStream_ =
      goog.net.streams.createXhrNodeReadableStream(xhr);

  /**
   * @private
   * @type {function(?):!RESPONSE} The deserialize function for the proto
   */
  this.responseDeserializeFn_ = responseDeserializeFn;

  /**
   * @private
   * @type {!goog.net.XhrIo} The XhrIo object
   */
  this.xhr_ = xhr;

  /**
   * @private
   * @type {function(!RESPONSE)|null} The data callback
   */
  this.onDataCallback_ = null;

  /**
   * @private
   * @type {function(!grpc.web.Status)|null}
   *   The status callback
   */
  this.onStatusCallback_ = null;

  /**
   * @private
   * @type {function(?):!grpc.web.Status}
   *   A function to parse the Rpc Status response
   */
  this.rpcStatusParseFn_ = rpcStatusParseFn;


  // Add the callback to the underlying stream
  var self = this;
  this.xhrNodeReadableStream_.on('data', function(data) {
    if ('1' in data && self.onDataCallback_) {
      var response = self.responseDeserializeFn_(data['1']);
      self.onDataCallback_(response);
    }
    if ('2' in data && self.onStatusCallback_) {
      var status = self.rpcStatusParseFn_(data['2']);
      self.onStatusCallback_(status);
    }
  });
};


/**
 * Register a callback to handle I/O events.
 *
 * @param {string} eventType The event type
 * @param {function(?)} callback The call back to handle the event with
 * an optional input object
 * @return {!grpc.web.ClientReadableStream} this object
 */
grpc.web.ClientReadableStream.prototype.on = function(
    eventType, callback) {
  // TODO(stanleycheung): change eventType to @enum type
  if (eventType == 'data') {
    this.onDataCallback_ = callback;
  } else if (eventType == 'status') {
    this.onStatusCallback_ = callback;
  }
  return this;
};


/**
 * Close the stream.
 */
grpc.web.ClientReadableStream.prototype.cancel = function() {
  this.xhr_.abort();
};
