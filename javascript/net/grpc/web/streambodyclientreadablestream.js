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
goog.module('grpc.web.StreamBodyClientReadableStream');

goog.module.declareLegacyNamespace();


const ClientReadableStream = goog.require('grpc.web.ClientReadableStream');
const ErrorCode = goog.require('goog.net.ErrorCode');
const NodeReadableStream = goog.require('goog.net.streams.NodeReadableStream');
const StatusCode = goog.require('grpc.web.StatusCode');
const XhrIo = goog.require('goog.net.XhrIo');
const {GenericTransportInterface} = goog.require('grpc.web.GenericTransportInterface');
const {Status} = goog.require('grpc.web.Status');



/**
 * A stream that the client can read from. Used for calls that are streaming
 * from the server side.
 *
 * @template RESPONSE
 * @constructor
 * @implements {ClientReadableStream}
 * @final
 * @param {!GenericTransportInterface} genericTransportInterface The
 *   GenericTransportInterface
 */
const StreamBodyClientReadableStream = function(genericTransportInterface) {
  /**
   * @const
   * @private
   * @type {?NodeReadableStream|undefined} The XHR Node Readable Stream
   */
  this.xhrNodeReadableStream_ = genericTransportInterface.nodeReadableStream;

  /**
   * @private
   * @type {function(?): RESPONSE|null} The deserialize function for the proto
   */
  this.responseDeserializeFn_ = null;

  /**
   * @const
   * @private
   * @type {?XhrIo|undefined} The XhrIo object
   */
  this.xhr_ = genericTransportInterface.xhr;

  /**
   * @const
   * @private
   * @type {!Array<function(RESPONSE)>} The list of data callback
   */
  this.onDataCallbacks_ = [];

  /**
   * @const
   * @private
   * @type {!Array<function(!Status)>} The list of status callback
   */
  this.onStatusCallbacks_ = [];

  /**
   * @const
   * @private
   * @type {!Array<function(...):?>} The list of stream end callback
   */
  this.onEndCallbacks_ = [];

  /**
   * @const
   * @private
   * @type {!Array<function(...):?>} The list of error callback
   */
  this.onErrorCallbacks_ = [];

  /**
   * @private
   * @type {function(?):!Status|null}
   *   A function to parse the Rpc Status response
   */
  this.rpcStatusParseFn_ = null;

  this.setStreamCallback_();

};

/**
 * @private
 */
StreamBodyClientReadableStream.prototype.setStreamCallback_ = function() {
  // Add the callback to the underlying stream
  var self = this;
  this.xhrNodeReadableStream_.on('data', function(data) {
    if ('1' in data) {
      var response = self.responseDeserializeFn_(data['1']);
      self.sendDataCallbacks_(response);
    }
    if ('2' in data) {
      var status = self.rpcStatusParseFn_(data['2']);
      self.sendStatusCallbacks_(status);
    }
  });
  this.xhrNodeReadableStream_.on('end', function() {
    self.sendEndCallbacks_();
  });
  this.xhrNodeReadableStream_.on('error', function() {
    if (self.onErrorCallbacks_.length == 0) return;
    var lastErrorCode = self.xhr_.getLastErrorCode();
    if (lastErrorCode === ErrorCode.NO_ERROR && !self.xhr_.isSuccess()) {
      // The lastErrorCode on the XHR isn't useful in this case, but the XHR
      // status is. Full details about the failure should be available in the
      // status handler.
      lastErrorCode = ErrorCode.HTTP_ERROR;
    }

    var grpcStatusCode;
    switch (lastErrorCode) {
      case ErrorCode.NO_ERROR:
        grpcStatusCode = StatusCode.UNKNOWN;
        break;
      case ErrorCode.ABORT:
        grpcStatusCode = StatusCode.ABORTED;
        break;
      case ErrorCode.TIMEOUT:
        grpcStatusCode = StatusCode.DEADLINE_EXCEEDED;
        break;
      case ErrorCode.HTTP_ERROR:
        grpcStatusCode = StatusCode.fromHttpStatus(self.xhr_.getStatus());
        break;
      default:
        grpcStatusCode = StatusCode.UNAVAILABLE;
    }

    self.sendErrorCallbacks_({
      code: grpcStatusCode,
      // TODO(armiller): get the message from the response?
      // GoogleRpcStatus.deserialize(rawResponse).getMessage()?
      // Perhaps do the same status logic as in on('data') above?
      message: ErrorCode.getDebugMessage(lastErrorCode)
    });
  });
};

/**
 * @override
 * @export
 */
StreamBodyClientReadableStream.prototype.on = function(
    eventType, callback) {
  // TODO(stanleycheung): change eventType to @enum type
  if (eventType == 'data') {
    this.onDataCallbacks_.push(callback);
  } else if (eventType == 'status') {
    this.onStatusCallbacks_.push(callback);
  } else if (eventType == 'end') {
    this.onEndCallbacks_.push(callback);
  } else if (eventType == 'error') {
    this.onErrorCallbacks_.push(callback);
  }
  return this;
};


/**
 * @private
 * @param {!Array<function(?)>} callbacks the internal list of callbacks
 * @param {function(?)} callback the callback to remove
 */
StreamBodyClientReadableStream.prototype.removeListenerFromCallbacks_ = function(
  callbacks, callback) {
  const index = callbacks.indexOf(callback);
  if (index > -1) {
    callbacks.splice(index, 1);
  }
};


/**
 * @export
 * @override
 */
StreamBodyClientReadableStream.prototype.removeListener = function(
  eventType, callback) {
  if (eventType == 'data') {
    this.removeListenerFromCallbacks_(this.onDataCallbacks_, callback);
  } else if (eventType == 'status') {
    this.removeListenerFromCallbacks_(this.onStatusCallbacks_, callback);
  } else if (eventType == 'end') {
    this.removeListenerFromCallbacks_(this.onEndCallbacks_, callback);
  } else if (eventType == 'error') {
    this.removeListenerFromCallbacks_(this.onErrorCallbacks_, callback);
  }
  return this;
};


/**
 * Register a callbackl to parse the response
 *
 * @param {function(?): RESPONSE} responseDeserializeFn The deserialize
 *   function for the proto
 */
StreamBodyClientReadableStream.prototype.setResponseDeserializeFn =
  function(responseDeserializeFn) {
  this.responseDeserializeFn_ = responseDeserializeFn;
};

/**
 * Register a function to parse RPC status response
 *
 * @param {function(?):!Status} rpcStatusParseFn A function to parse
 *    the RPC status response
 */
StreamBodyClientReadableStream.prototype.setRpcStatusParseFn = function(rpcStatusParseFn) {
  this.rpcStatusParseFn_ = rpcStatusParseFn;
};


/**
 * @override
 * @export
 */
StreamBodyClientReadableStream.prototype.cancel = function() {
  this.xhr_.abort();
};


/**
 * @private
 * @param {!RESPONSE} data The data to send back
 */
StreamBodyClientReadableStream.prototype.sendDataCallbacks_ = function(data) {
  for (var i = 0; i < this.onDataCallbacks_.length; i++) {
    this.onDataCallbacks_[i](data);
  }
};


/**
 * @private
 * @param {!Status} status The status to send back
 */
StreamBodyClientReadableStream.prototype.sendStatusCallbacks_ = function(status) {
  for (var i = 0; i < this.onStatusCallbacks_.length; i++) {
    this.onStatusCallbacks_[i](status);
  }
};


/**
 * @private
 * @param {?} error The error to send back
 */
StreamBodyClientReadableStream.prototype.sendErrorCallbacks_ = function(error) {
  for (var i = 0; i < this.onErrorCallbacks_.length; i++) {
    this.onErrorCallbacks_[i](error);
  }
};


/**
 * @private
 */
StreamBodyClientReadableStream.prototype.sendEndCallbacks_ = function() {
  for (var i = 0; i < this.onEndCallbacks_.length; i++) {
    this.onEndCallbacks_[i]();
  }
};


exports = StreamBodyClientReadableStream;
