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
const EventType = goog.require('goog.net.EventType');
const GrpcWebError = goog.requireType('grpc.web.Error');
const NodeReadableStream = goog.require('goog.net.streams.NodeReadableStream');
const StatusCode = goog.require('grpc.web.StatusCode');
const XhrIo = goog.require('goog.net.XhrIo');
const events = goog.require('goog.events');
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
   * @private
   * @type {function(RESPONSE)|null} The data callback
   */
  this.onDataCallback_ = null;

  /**
   * @private
   * @type {function(!Status)|null}
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
   * @type {function(?):!Status|null}
   *   A function to parse the Rpc Status response
   */
  this.rpcStatusParseFn_ = null;

  /**
   * @private
   * @type {function(?GrpcWebError, ?)|null}
   */
  this.onErrorResponseCallback_ = null;

  if (this.xhrNodeReadableStream_) {
    this.setStreamCallback_();
  } else if (this.xhr_) {
    this.setUnaryCallback_();
  }
};

/**
 * @private
 */
StreamBodyClientReadableStream.prototype.setUnaryCallback_ = function() {
  events.listen(/** @type {!XhrIo} */ (this.xhr_), EventType.COMPLETE, (e) => {
    if (this.xhr_.isSuccess()) {
      // If the response is serialized as Base64 (for example if the
      // X-Goog-Encode-Response-If-Executable header is in effect), decode it
      // before passing it to the deserializer.
      var responseText = this.xhr_.getResponseText();
      if (this.xhr_.headers.get('X-Goog-Encode-Response-If-Executable') ==
              'base64' &&
          this.xhr_.getResponseHeader(XhrIo.CONTENT_TYPE_HEADER) ===
              'text/plain') {
        if (!atob) {
          throw new Error('Cannot decode Base64 response');
        }
        responseText = atob(responseText);
      }

      var response = this.responseDeserializeFn_(responseText);
      var grpcStatus = StatusCode.fromHttpStatus(this.xhr_.getStatus());
      if (grpcStatus == StatusCode.OK) {
        this.onDataCallback_(response);
      } else {
        this.onErrorResponseCallback_(
            /** @type {!GrpcWebError} */ ({
              code: grpcStatus,
            }),
            response);
      }
    } else if (this.xhr_.getStatus() == 404) {
      var message = 'Not Found: ' + this.xhr_.getLastUri();
      this.onErrorCallback_({
        code: StatusCode.NOT_FOUND,
        message: message,
      });
    } else {
      var rawResponse = this.xhr_.getResponseText();
      if (rawResponse) {
        var status = this.rpcStatusParseFn_(rawResponse);
        this.onErrorCallback_({
          code: status.code,
          message: status.details,
          metadata: status.metadata,
        });
      } else {
        this.onErrorCallback_({
          code: StatusCode.UNAVAILABLE,
          message: ErrorCode.getDebugMessage(this.xhr_.getLastErrorCode()),
        });
      }
    }
  });
};

/**
 * @private
 */
StreamBodyClientReadableStream.prototype.setStreamCallback_ = function() {
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
    if (!self.onErrorCallback_) return;
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

    self.onErrorCallback_({
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
StreamBodyClientReadableStream.prototype.setResponseDeserializeFn =
  function(responseDeserializeFn) {
  this.responseDeserializeFn_ = responseDeserializeFn;
};

/**
 * @param {function(?GrpcWebError, ?)} errorResponseFn
 */
StreamBodyClientReadableStream.prototype.setErrorResponseFn = function(
    errorResponseFn) {
  this.onErrorResponseCallback_ = errorResponseFn;
  this.onDataCallback_ = (response) => errorResponseFn(null, response);
  this.onErrorCallback_ = (error) => errorResponseFn(error, null);
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



exports = StreamBodyClientReadableStream;
