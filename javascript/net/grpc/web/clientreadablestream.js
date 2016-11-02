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
goog.require('jspb.Message');
goog.require('proto.google.rpc.Status');
goog.require('proto.grpc.gateway.Pair');


/**
 * A stream that the client can read from. Used for calls that are streaming
 * from the server side.
 *
 * @constructor
 * @final
 * @param {!goog.net.XhrIo} xhr The XhrIo object
 * @param {function(?):!jspb.Message} deserializeFunc
 *   The deserialize function for the proto
 */
grpc.web.ClientReadableStream = function(
    xhr, deserializeFunc) {
  /**
   * @private
   * @type {?goog.net.streams.NodeReadableStream} The XHR Node Readable
   *   Stream
   */
  this.xhrNodeReadableStream_ =
    goog.net.streams.createXhrNodeReadableStream(xhr);

  /**
   * @private
   * @type {function(?):!jspb.Message} The deserialize function for the proto
   */
  this.deserializeFunc_ = deserializeFunc;

  /**
   * @private
   * @type {!goog.net.XhrIo} The XhrIo object
   */
  this.xhr_ = xhr;

  /**
   * @private
   * @type {function(!Object)|null} The trailing metadata callback
   */
  this.onStatusCallback_ = null;
};


/**
 * Register a callback to handle I/O events.
 *
 * @param {string} eventType The event type
 * @param {function(!Object=)} callback The call back to handle the event with
 * an optional input object
 * @return {!grpc.web.ClientReadableStream} this object
 */
grpc.web.ClientReadableStream.prototype.on = function(
    eventType, callback) {
  var self = this;
  if (eventType == 'data') {
    this.xhrNodeReadableStream_.on('data', function(data) {
      if ('1' in data) {
        var base64_message = data['1'];
        var response = self.deserializeFunc_(base64_message);
        callback(response);
      }
      if ('2' in data) {
        var base64_message = data['2'];
        var _status =
          proto.google.rpc.Status.deserializeBinary(base64_message);
        var status = {};
        var metadata = {};
        status['code'] = _status.getCode();
        status['details'] = _status.getMessage();
        var details = _status.getDetailsList();
        for (var i = 0; i < details.length; i++) {
          var pair = proto.grpc.gateway.Pair.deserializeBinary(
              details[i].getValue());
          var first = new TextDecoder("utf-8").decode(
              /** @type {!ArrayBufferView|undefined} */ (pair.getFirst_asU8()));
          var second = new TextDecoder("utf-8").decode(
              /** @type {!ArrayBufferView|undefined} */ (pair.getSecond_asU8()));
          metadata[first] = second;
        }
        status['metadata'] = metadata;
        if (self.onStatusCallback_) {
          self.onStatusCallback_(status);
        }
      }
    });
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
