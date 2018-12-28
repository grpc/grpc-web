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
goog.module('grpc.web.GrpcWebClientReadableStream');

goog.module.declareLegacyNamespace();


const ClientReadableStream = goog.require('grpc.web.ClientReadableStream');
const ErrorCode = goog.require('goog.net.ErrorCode');
const EventType = goog.require('goog.net.EventType');
const GrpcWebStreamParser = goog.require('grpc.web.GrpcWebStreamParser');
const StatusCode = goog.require('grpc.web.StatusCode');
const XhrIo = goog.require('goog.net.XhrIo');
const XmlHttp = goog.require('goog.net.XmlHttp');
const events = goog.require('goog.events');
const googCrypt = goog.require('goog.crypt.base64');
const googString = goog.require('goog.string');
const {GenericTransportInterface} = goog.require('grpc.web.GenericTransportInterface');
const {Status} = goog.require('grpc.web.Status');



const GRPC_STATUS = "grpc-status";
const GRPC_STATUS_MESSAGE = "grpc-message";


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
const GrpcWebClientReadableStream = function(genericTransportInterface) {
  /**
   * @const
   * @private
   * @type {?XhrIo} The XhrIo object
   */
  this.xhr_ = /** @type {?XhrIo} */ (genericTransportInterface.xhr);

  /**
   * @private
   * @type {function(?):!RESPONSE|null} The deserialize function for the proto
   */
  this.responseDeserializeFn_ = null;

  /**
   * @private
   * @type {function(!RESPONSE)|null} The data callback
   */
  this.onDataCallback_ = null;

  /**
   * @private
   * @type {function(!Status)|null} The status callback
   */
  this.onStatusCallback_ = null;

  /**
   * @private
   * @type {function(...):?|null} The error callback
   */
  this.onErrorCallback_ = null;

  /**
   * @private
   * @type {function(...):?|null} The stream end callback
   */
  this.onEndCallback_ = null;

  /**
   * @private
   * @type {number} The stream parser position
   */
  this.pos_ = 0;

  /**
   * @private
   * @type {!GrpcWebStreamParser} The grpc-web stream parser
   * @const
   */
  this.parser_ = new GrpcWebStreamParser();

  var self = this;
  events.listen(this.xhr_, EventType.READY_STATE_CHANGE,
                function(e) {
    var contentType = self.xhr_.getStreamingResponseHeader('Content-Type');
    if (!contentType) return;
    contentType = contentType.toLowerCase();

    var grpcStatusCode = self.xhr_.getStreamingResponseHeader(GRPC_STATUS);
    var grpcStatusMessage = self.xhr_.getStreamingResponseHeader(GRPC_STATUS_MESSAGE);
    if (grpcStatusCode && self.onStatusCallback_) {
      self.onStatusCallback_(/** @type {!Status} */({
        code: Number(grpcStatusCode),
        details: grpcStatusMessage || '',
        metadata: undefined,
      }));
    }

    if (googString.startsWith(contentType, 'application/grpc-web-text')) {
      var responseText = self.xhr_.getResponseText();
      var newPos = responseText.length - responseText.length % 4;
      var newData = responseText.substr(self.pos_, newPos - self.pos_);
      if (newData.length == 0) return;
      self.pos_ = newPos;
      var byteSource = googCrypt.decodeStringToUint8Array(newData);
    } else if (googString.startsWith(contentType, 'application/grpc')) {
      var byteSource = new Uint8Array(
        /** @type {!ArrayBuffer} */ (self.xhr_.getResponse()));
    } else {
      return;
    }
    var messages = self.parser_.parse([].slice.call(byteSource));
    if (!messages) return;

    var FrameType = GrpcWebStreamParser.FrameType;
    for (var i = 0; i < messages.length; i++) {
      if (FrameType.DATA in messages[i]) {
        var data = messages[i][FrameType.DATA];
        if (data) {
          var response = self.responseDeserializeFn_(data);
          if (response) {
            self.onDataCallback_(response);
          }
        }
      }
      if (FrameType.TRAILER in messages[i]) {
        if (messages[i][FrameType.TRAILER].length > 0) {
          var trailerString = "";
          for (var pos = 0; pos < messages[i][FrameType.TRAILER].length;
            pos++) {
            trailerString += String.fromCharCode(
              messages[i][FrameType.TRAILER][pos]);
          }
          var trailers = self.parseHttp1Headers_(trailerString);
          grpcStatusCode = StatusCode.OK;
          grpcStatusMessage = "";
          if (GRPC_STATUS in trailers) {
            grpcStatusCode = trailers[GRPC_STATUS];
          }
          if (GRPC_STATUS_MESSAGE in trailers) {
            grpcStatusMessage = trailers[GRPC_STATUS_MESSAGE];
          }
          if (self.onStatusCallback_) {
            self.onStatusCallback_(/** @type {!Status} */({
              code: Number(grpcStatusCode),
              details: grpcStatusMessage,
              metadata: trailers,
            }));
          }
        }
      }
    }

    var readyState = self.xhr_.getReadyState();
    if (readyState == XmlHttp.ReadyState.COMPLETE) {
      if (self.onEndCallback_) {
        self.onEndCallback_();
      }
      return;
    }
  });

  events.listen(this.xhr_, EventType.COMPLETE, function(e) {
    if (!self.onErrorCallback_) return;
    var lastErrorCode = self.xhr_.getLastErrorCode();
    if (lastErrorCode != ErrorCode.NO_ERROR) {
      self.onErrorCallback_({
        code: StatusCode.UNAVAILABLE,
        message: ErrorCode.getDebugMessage(lastErrorCode)
      });
      return;
    }
    var responseHeaders = self.xhr_.getResponseHeaders();
    if (GRPC_STATUS in responseHeaders &&
        Number(self.xhr_.getResponseHeader(GRPC_STATUS)) != StatusCode.OK) {
      self.onErrorCallback_({
        code: Number(self.xhr_.getResponseHeader(GRPC_STATUS)),
        message: self.xhr_.getResponseHeader(GRPC_STATUS_MESSAGE)
      });
    }
  });
};


/**
 * @override
 * @export
 */
GrpcWebClientReadableStream.prototype.on = function(
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
 * @param {function(?):!RESPONSE} responseDeserializeFn The deserialize
 *   function for the proto
 */
GrpcWebClientReadableStream.prototype.setResponseDeserializeFn =
  function(responseDeserializeFn) {
  this.responseDeserializeFn_ = responseDeserializeFn;
};


/**
 * @override
 * @export
 */
GrpcWebClientReadableStream.prototype.cancel = function() {
  this.xhr_.abort();
};


/**
 * Parse HTTP headers
 *
 * @private
 * @param {string} str The raw http header string
 * @return {!Object} The header:value pairs
 */
GrpcWebClientReadableStream.prototype.parseHttp1Headers_ =
  function(str) {
  var chunks = str.trim().split("\r\n");
  var headers = {};
  for (var i = 0; i < chunks.length; i++) {
    var pos = chunks[i].indexOf(":");
    headers[chunks[i].substring(0, pos).trim()] =
      chunks[i].substring(pos+1).trim();
  }
  return headers;
};



exports = GrpcWebClientReadableStream;
