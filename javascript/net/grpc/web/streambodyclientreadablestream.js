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
goog.provide('grpc.web.StreamBodyClientReadableStream');


goog.require('goog.net.XhrIo');
goog.require('goog.net.streams.NodeReadableStream');
goog.require('goog.net.streams.createXhrNodeReadableStream');
goog.require('grpc.web.ClientReadableStream');
goog.require('grpc.web.Status');



/**
 * A stream that the client can read from. Used for calls that are streaming
 * from the server side.
 *
 * @template RESPONSE
 * @constructor
 * @implements {grpc.web.ClientReadableStream}
 * @final
 * @param {!goog.net.XhrIo} xhr The XhrIo object
 */
grpc.web.StreamBodyClientReadableStream = function(
    xhr) {
  /**
   * @private
   * @type {?goog.net.streams.NodeReadableStream} The XHR Node Readable
   *   Stream
   */
  this.xhrNodeReadableStream_ =
      goog.net.streams.createXhrNodeReadableStream(xhr);

  /**
   * @private
   * @type {function(?): RESPONSE|null} The deserialize function for the proto
   */
  this.responseDeserializeFn_ = null;

  /**
   * @private
   * @type {!goog.net.XhrIo} The XhrIo object
   */
  this.xhr_ = xhr;

  /**
   * @private
   * @type {function(RESPONSE)|null} The data callback
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
   * @type {function(...):?|null}
   *   The stream end callback
   */
  this.onEndCallback_ = null;

  /**
   * @private
   * @type {function(...):?|null}
   *   The stream error callback
   */
  this.onErrorCallback_ = null;

  /**
   * @private
   * @type {function(?):!grpc.web.Status|null}
   *   A function to parse the Rpc Status response
   */
  this.rpcStatusParseFn_ = null;


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
  this.xhrNodeReadableStream_.on('end', function() {
    if (self.onEndCallback_) {
      self.onEndCallback_();
    }
  });
  this.xhrNodeReadableStream_.on('error', function() {
    if (self.onErrorCallback_) {
      self.onErrorCallback_();
    }
  });
};


/**
 * @override
 */
grpc.web.StreamBodyClientReadableStream.prototype.on = function(
    eventType, callback) {
  // TODO(stanleycheung): change eventType to @enum type
  if (eventType == 'data') {
    this.onDataCallback_ = callback;
  } else if (eventType == 'status') {
    this.onStatusCallback_ = callback;
  } else if (eventType == 'end') {
    this.onEndCallback_ = callback;
  } else if (eventType == 'error') {
    this.onErrorCallback_ = callback;
  }
  return this;
};


/**
 * Register a callbackl to parse the response
 *
 * @param {function(?): RESPONSE} responseDeserializeFn The deserialize
 *   function for the proto
 */
grpc.web.StreamBodyClientReadableStream.prototype.setResponseDeserializeFn =
  function(responseDeserializeFn) {
  this.responseDeserializeFn_ = responseDeserializeFn;
};



/**
 * Register a function to parse RPC status response
 *
 * @param {function(?):!grpc.web.Status} rpcStatusParseFn A function to parse
 *    the RPC status response
 */
grpc.web.StreamBodyClientReadableStream.prototype.setRpcStatusParseFn = function(rpcStatusParseFn) {
  this.rpcStatusParseFn_ = rpcStatusParseFn;
};


/**
 * @override
 */
grpc.web.StreamBodyClientReadableStream.prototype.cancel = function() {
  this.xhr_.abort();
};
