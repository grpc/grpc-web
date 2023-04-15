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
const RpcError = goog.require('grpc.web.RpcError');
const StatusCode = goog.require('grpc.web.StatusCode');
const XhrIo = goog.require('goog.net.XhrIo');
const events = goog.require('goog.events');
const googCrypt = goog.require('goog.crypt.base64');
const googString = goog.require('goog.string');
const {GenericTransportInterface} = goog.require('grpc.web.GenericTransportInterface');
const {Status} = goog.require('grpc.web.Status');



const GRPC_STATUS = 'grpc-status';
const GRPC_STATUS_MESSAGE = 'grpc-message';

/** @type {!Array<string>} */
const EXCLUDED_RESPONSE_HEADERS =
    ['content-type', GRPC_STATUS, GRPC_STATUS_MESSAGE];

/**
 * A stream that the client can read from. Used for calls that are streaming
 * from the server side.
 * @template RESPONSE
 * @implements {ClientReadableStream}
 * @final
 * @unrestricted
 */
class GrpcWebClientReadableStream {
  /**
   * @param {!GenericTransportInterface} genericTransportInterface The
   *   GenericTransportInterface
   */
  constructor(genericTransportInterface) {
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
     * @const
     * @private
     * @type {!Array<function(!RESPONSE)>} The list of data callbacks
     */
    this.onDataCallbacks_ = [];

    /**
     * @const
     * @private
     * @type {!Array<function(!Status)>} The list of status callbacks
     */
    this.onStatusCallbacks_ = [];

    /**
     * @const
     * @private
     * @type {!Array<function(!Metadata)>} The list of metadata callbacks
     */
    this.onMetadataCallbacks_ = [];

    /**
     * @const
     * @private
     * @type {!Array<function(!RpcError)>} The list of error callbacks
     */
    this.onErrorCallbacks_ = [];

    /**
     * @const
     * @private
     * @type {!Array<function(...):?>} The list of stream end callbacks
     */
    this.onEndCallbacks_ = [];

    /**
     * @private
     * @type {boolean} Whether the stream has been aborted
     */
    this.aborted_ = false;

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

    const self = this;
    events.listen(this.xhr_, EventType.READY_STATE_CHANGE, function(e) {
      let contentType = self.xhr_.getStreamingResponseHeader('Content-Type');
      if (!contentType) return;
      contentType = contentType.toLowerCase();

      let byteSource;
      if (googString.startsWith(contentType, 'application/grpc-web-text')) {
        // Ensure responseText is not null
        const responseText = self.xhr_.getResponseText() || '';
        const newPos = responseText.length - responseText.length % 4;
        const newData = responseText.substr(self.pos_, newPos - self.pos_);
        if (newData.length == 0) return;
        self.pos_ = newPos;
        byteSource = googCrypt.decodeStringToUint8Array(newData);
      } else if (googString.startsWith(contentType, 'application/grpc')) {
        byteSource = new Uint8Array(
            /** @type {!ArrayBuffer} */ (self.xhr_.getResponse()));
      } else {
        self.handleError_(
            new RpcError(StatusCode.UNKNOWN, 'Unknown Content-type received.'));
        return;
      }
      let messages = null;
      try {
        messages = self.parser_.parse(byteSource);
      } catch (err) {
        self.handleError_(
            new RpcError(StatusCode.UNKNOWN, 'Error in parsing response body'));
      }
      if (messages) {
        const FrameType = GrpcWebStreamParser.FrameType;
        for (let i = 0; i < messages.length; i++) {
          if (FrameType.DATA in messages[i]) {
            const data = messages[i][FrameType.DATA];
            if (data) {
              let isResponseDeserialized = false;
              let response;
              try {
                response = self.responseDeserializeFn_(data);
                isResponseDeserialized = true;
              } catch (err) {
                self.handleError_(new RpcError(
                    StatusCode.INTERNAL,
                    `Error when deserializing response data; error: ${err}` +
                        `, response: ${response}`));
              }
              if (isResponseDeserialized) {
                self.sendDataCallbacks_(response);
              }
            }
          }
          if (FrameType.TRAILER in messages[i]) {
            if (messages[i][FrameType.TRAILER].length > 0) {
              let trailerString = '';
              for (let pos = 0; pos < messages[i][FrameType.TRAILER].length;
                   pos++) {
                trailerString +=
                    String.fromCharCode(messages[i][FrameType.TRAILER][pos]);
              }
              const trailers = self.parseHttp1Headers_(trailerString);
              let grpcStatusCode = StatusCode.OK;
              let grpcStatusMessage = '';
              if (GRPC_STATUS in trailers) {
                grpcStatusCode =
                    /** @type {!StatusCode} */ (Number(trailers[GRPC_STATUS]));
                delete trailers[GRPC_STATUS];
              }
              if (GRPC_STATUS_MESSAGE in trailers) {
                grpcStatusMessage = trailers[GRPC_STATUS_MESSAGE];
                delete trailers[GRPC_STATUS_MESSAGE];
              }
              self.handleError_(
                  new RpcError(grpcStatusCode, grpcStatusMessage, trailers));
            }
          }
        }
      }
    });

    events.listen(this.xhr_, EventType.COMPLETE, function(e) {
      const lastErrorCode = self.xhr_.getLastErrorCode();
      let grpcStatusCode = StatusCode.UNKNOWN;
      let grpcStatusMessage = '';
      const initialMetadata = /** @type {!Metadata} */ ({});

      // Get response headers with lower case keys.
      const rawResponseHeaders = self.xhr_.getResponseHeaders();
      const responseHeaders = {};
      for (const key in rawResponseHeaders) {
        if (rawResponseHeaders.hasOwnProperty(key)) {
          responseHeaders[key.toLowerCase()] = rawResponseHeaders[key];
        }
      }

      Object.keys(responseHeaders).forEach((header_) => {
        if (!(EXCLUDED_RESPONSE_HEADERS.includes(header_))) {
          initialMetadata[header_] = responseHeaders[header_];
        }
      });
      self.sendMetadataCallbacks_(initialMetadata);

      // There's an XHR level error
      let xhrStatusCode = -1;
      if (lastErrorCode != ErrorCode.NO_ERROR) {
        switch (lastErrorCode) {
          case ErrorCode.ABORT:
            grpcStatusCode = StatusCode.ABORTED;
            break;
          case ErrorCode.TIMEOUT:
            grpcStatusCode = StatusCode.DEADLINE_EXCEEDED;
            break;
          case ErrorCode.HTTP_ERROR:
            xhrStatusCode = self.xhr_.getStatus();
            grpcStatusCode = StatusCode.fromHttpStatus(xhrStatusCode);
            break;
          default:
            grpcStatusCode = StatusCode.UNAVAILABLE;
        }
        if (grpcStatusCode == StatusCode.ABORTED && self.aborted_) {
          return;
        }
        let errorMessage = ErrorCode.getDebugMessage(lastErrorCode);
        if (xhrStatusCode != -1) {
          errorMessage += ', http status code: ' + xhrStatusCode;
        }

        self.handleError_(new RpcError(grpcStatusCode, errorMessage));
        return;
      }

      let errorEmitted = false;

      // Check whethere there are grpc specific response headers
      if (GRPC_STATUS in responseHeaders) {
        grpcStatusCode = /** @type {!StatusCode} */ (
            Number(responseHeaders[GRPC_STATUS]));
        if (GRPC_STATUS_MESSAGE in responseHeaders) {
          grpcStatusMessage = responseHeaders[GRPC_STATUS_MESSAGE];
        }
        if (grpcStatusCode != StatusCode.OK) {
          self.handleError_(new RpcError(
              grpcStatusCode, grpcStatusMessage || '', responseHeaders));
          errorEmitted = true;
        }
      }

      if (!errorEmitted) {
        self.sendEndCallbacks_();
      }
    });
  }

  /**
   * @override
   * @export
   */
  on(eventType, callback) {
    // TODO(stanleycheung): change eventType to @enum type
    if (eventType == 'data') {
      this.onDataCallbacks_.push(callback);
    } else if (eventType == 'status') {
      this.onStatusCallbacks_.push(callback);
    } else if (eventType == 'metadata') {
      this.onMetadataCallbacks_.push(callback);
    } else if (eventType == 'end') {
      this.onEndCallbacks_.push(callback);
    } else if (eventType == 'error') {
      this.onErrorCallbacks_.push(callback);
    }
    return this;
  }

  /**
   * @private
   * @param {!Array<function(?)>} callbacks the internal list of callbacks
   * @param {function(?)} callback the callback to remove
   */
  removeListenerFromCallbacks_(callbacks, callback) {
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  /**
   * @export
   * @override
   */
  removeListener(eventType, callback) {
    if (eventType == 'data') {
      this.removeListenerFromCallbacks_(this.onDataCallbacks_, callback);
    } else if (eventType == 'status') {
      this.removeListenerFromCallbacks_(this.onStatusCallbacks_, callback);
    } else if (eventType == 'metadata') {
      this.removeListenerFromCallbacks_(this.onMetadataCallbacks_, callback);
    } else if (eventType == 'end') {
      this.removeListenerFromCallbacks_(this.onEndCallbacks_, callback);
    } else if (eventType == 'error') {
      this.removeListenerFromCallbacks_(this.onErrorCallbacks_, callback);
    }
    return this;
  }

  /**
   * Register a callbackl to parse the response
   *
   * @param {function(?):!RESPONSE} responseDeserializeFn The deserialize
   *   function for the proto
   */
  setResponseDeserializeFn(responseDeserializeFn) {
    this.responseDeserializeFn_ = responseDeserializeFn;
  }

  /**
   * @override
   * @export
   */
  cancel() {
    this.aborted_ = true;
    this.xhr_.abort();
  }

  /**
   * Parse HTTP headers
   *
   * @private
   * @param {string} str The raw http header string
   * @return {!Object} The header:value pairs
   */
  parseHttp1Headers_(str) {
    const chunks = str.trim().split('\r\n');
    const headers = {};
    for (let i = 0; i < chunks.length; i++) {
      const pos = chunks[i].indexOf(':');
      headers[chunks[i].substring(0, pos).trim()] =
          chunks[i].substring(pos + 1).trim();
    }
    return headers;
  }

  /**
   * A central place to handle errors
   *
   * @private
   * @param {!RpcError} error The error object
   */
  handleError_(error) {
    if (error.code != StatusCode.OK) {
      this.sendErrorCallbacks_(new RpcError(
          error.code, decodeURIComponent(error.message || ''), error.metadata));
    }
    this.sendStatusCallbacks_(/** @type {!Status} */ ({
      code: error.code,
      details: decodeURIComponent(error.message || ''),
      metadata: error.metadata
    }));
  }

  /**
   * @private
   * @param {!RESPONSE} data The data to send back
   */
  sendDataCallbacks_(data) {
    for (let i = 0; i < this.onDataCallbacks_.length; i++) {
      this.onDataCallbacks_[i](data);
    }
  }

  /**
   * @private
   * @param {!Status} status The status to send back
   */
  sendStatusCallbacks_(status) {
    for (let i = 0; i < this.onStatusCallbacks_.length; i++) {
      this.onStatusCallbacks_[i](status);
    }
  }

  /**
   * @private
   * @param {!Metadata} metadata The metadata to send back
   */
  sendMetadataCallbacks_(metadata) {
    for (let i = 0; i < this.onMetadataCallbacks_.length; i++) {
      this.onMetadataCallbacks_[i](metadata);
    }
  }

  /**
   * @private
   * @param {!RpcError} error The error to send back
   */
  sendErrorCallbacks_(error) {
    for (let i = 0; i < this.onErrorCallbacks_.length; i++) {
      this.onErrorCallbacks_[i](error);
    }
  }

  /**
   * @private
   */
  sendEndCallbacks_() {
    for (let i = 0; i < this.onEndCallbacks_.length; i++) {
      this.onEndCallbacks_[i]();
    }
  }
}



exports = GrpcWebClientReadableStream;
