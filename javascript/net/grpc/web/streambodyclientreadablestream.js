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
const GoogleRpcStatus = goog.require('proto.google.rpc.Status');
const Metadata = goog.requireType('grpc.web.Metadata');
const NodeReadableStream = goog.require('goog.net.streams.NodeReadableStream');
const RpcError = goog.require('grpc.web.RpcError');
const StatusCode = goog.require('grpc.web.StatusCode');
const XhrIo = goog.require('goog.net.XhrIo');
const asserts = goog.require('goog.asserts');
const events = goog.require('goog.events');
const {GenericTransportInterface} = goog.require('grpc.web.GenericTransportInterface');
const {Status} = goog.require('grpc.web.Status');



/**
 * A stream that the client can read from. Used for calls that are streaming
 * from the server side.
 * @template RESPONSE
 * @implements {ClientReadableStream}
 * @final
 * @unrestricted
 */
class StreamBodyClientReadableStream {
  /**
   * @param {!GenericTransportInterface} genericTransportInterface
   * @param {function(?): RESPONSE} responseDeserializeFn
   * @param {boolean} isBinary
   */
  constructor(genericTransportInterface, responseDeserializeFn, isBinary) {
    /**
     * Whether or not the response protobuffer format is binary.
     * @private
     * @const {boolean}
     */
    this.isBinary_ = isBinary;

    /**
     * @private
     * @const {?NodeReadableStream|undefined} The XHR Node Readable Stream
     */
    this.xhrNodeReadableStream_ = genericTransportInterface.nodeReadableStream;

    /**
     * @private
     * @const {function(?): RESPONSE} The deserialize function for the proto
     */
    this.grpcResponseDeserializeFn_ = responseDeserializeFn;

    /**
     * @private
     * @const {?XhrIo|undefined} The XhrIo object
     */
    this.xhr_ = genericTransportInterface.xhr;

    /**
     * @private
     * @const {!Array<function(RESPONSE)>} The list of data callback
     */
    this.onDataCallbacks_ = [];

    /**
     * @private
     * @const {!Array<function(!Metadata)>} The list of metadata callbacks
     */
    this.onMetadataCallbacks_ = [];

    /**
     * @private
     * @const {!Array<function(!Status)>} The list of status callback
     */
    this.onStatusCallbacks_ = [];

    /**
     * @private
     * @const {!Array<function(...)>} The list of stream end callback
     */
    this.onEndCallbacks_ = [];

    /**
     * @private
     * @const {!Array<function(!RpcError)>} The list of error callback
     */
    this.onErrorCallbacks_ = [];

    if (this.xhrNodeReadableStream_) {
      this.setStreamCallback_();
    }
  }


  /**
   * Set up the callback functions for unary calls.
   * @param {boolean} base64Encoded True if
   *     'X-Goog-Encode-Response-If-Executable' is 'base64' in request headers.
   */
  setUnaryCallback(base64Encoded) {
    events.listen(/** @type {!XhrIo}*/ (this.xhr_), EventType.COMPLETE, (e) => {
      if (this.xhr_.isSuccess()) {
        let response;
        if (this.isBinary_) {
          response = this.decodeBinaryResponse_(base64Encoded);
        } else {
          response = this.decodeJspbResponse_(base64Encoded);
        }
        const responseMessage = this.grpcResponseDeserializeFn_(response);
        const grpcStatus = StatusCode.fromHttpStatus(this.xhr_.getStatus());
        this.sendMetadataCallbacks_(this.readHeaders_());
        if (grpcStatus == StatusCode.OK) {
          this.sendDataCallbacks_(responseMessage);
        } else {
          this.sendErrorCallbacks_(new RpcError(
              grpcStatus, 'Xhr succeeded but the status code is not 200'));
        }
      } else {
        let rawResponse;
        if (this.isBinary_) {
          const xhrResponse = this.xhr_.getResponse();
          if (xhrResponse) {
            rawResponse =
                new Uint8Array(/** @type {!ArrayBuffer} */ (xhrResponse));
          }
        } else {
          rawResponse = this.xhr_.getResponseText();
        }

        let code;
        let message;
        let metadata = {};
        if (rawResponse) {
          const status = this.parseRpcStatus_(rawResponse);
          code = status.code;
          message = status.details;
          metadata = status.metadata;
        } else {
          code = StatusCode.UNKNOWN;
          message = 'Rpc failed due to xhr error. error code: ' +
              this.xhr_.getLastErrorCode() +
              ', error: ' + this.xhr_.getLastError();
        }
        this.sendMetadataCallbacks_(this.readHeaders_());
        this.sendErrorCallbacks_(new RpcError(code, message, metadata));
      }
    });
  }

  /**
   * @private
   */
  setStreamCallback_() {
    // Add the callback to the underlying stream
    this.xhrNodeReadableStream_.on('data', (data) => {
      if ('1' in data) {
        const response = this.grpcResponseDeserializeFn_(data['1']);
        this.sendDataCallbacks_(response);
      }
      if ('2' in data) {
        const status = this.parseRpcStatus_(data['2']);
        this.sendStatusCallbacks_(status);
      }
    });

    this.xhrNodeReadableStream_.on('end', () => {
      this.sendMetadataCallbacks_(this.readHeaders_());
      this.sendEndCallbacks_();
    });

    this.xhrNodeReadableStream_.on('error', () => {
      if (this.onErrorCallbacks_.length == 0) return;
      let lastErrorCode = this.xhr_.getLastErrorCode();
      if (lastErrorCode === ErrorCode.NO_ERROR && !this.xhr_.isSuccess()) {
        // The lastErrorCode on the XHR isn't useful in this case, but the XHR
        // status is. Full details about the failure should be available in the
        // status handler.
        lastErrorCode = ErrorCode.HTTP_ERROR;
      }

      let grpcStatusCode;
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
          grpcStatusCode = StatusCode.fromHttpStatus(this.xhr_.getStatus());
          break;
        default:
          grpcStatusCode = StatusCode.UNAVAILABLE;
      }

      this.sendMetadataCallbacks_(this.readHeaders_());
      this.sendErrorCallbacks_(new RpcError(
          grpcStatusCode,
          // TODO(armiller): get the message from the response?
          // GoogleRpcStatus.deserialize(rawResponse).getMessage()?
          // Perhaps do the same status logic as in on('data') above?
          ErrorCode.getDebugMessage(lastErrorCode) +
              ', error: ' + this.xhr_.getLastError()));
    });
  }

  /**
   * @private
   * @param {boolean} base64Encoded
   * @return {string}
   */
  decodeJspbResponse_(base64Encoded) {
    // If the response is serialized as Base64 (for example if the
    // X-Goog-Encode-Response-If-Executable header is in effect), decode it
    // before passing it to the deserializer.
    let responseText = this.xhr_.getResponseText();
    if (base64Encoded &&
        this.xhr_.getResponseHeader(XhrIo.CONTENT_TYPE_HEADER) ===
            'text/plain') {
      if (!atob) {
        throw new Error('Cannot decode Base64 response');
      }
      responseText = atob(responseText);
    }
    return responseText;
  }

  /**
   * @private
   * @param {boolean} base64Encoded
   * @return {*}
   */
  decodeBinaryResponse_(base64Encoded) {
    if (base64Encoded &&
        this.xhr_.getResponseHeader('X-Goog-Safety-Encoding') == 'base64') {
      // Convert the response's ArrayBuffer to a string, which should
      // be a base64 encoded string.
      const bytes = new Uint8Array(
          /** @type {!ArrayBuffer} */ (this.xhr_.getResponse()));
      let byteSource = '';
      for (let i = 0; i < bytes.length; i++) {
        byteSource += String.fromCharCode(bytes[i]);
      }
      return byteSource;
    } else {
      return this.xhr_.getResponse();
    }
  }

  /**
   * @private
   * @return {!Metadata}
   */
  readHeaders_() {
    const initialMetadata = {};
    const responseHeaders = this.xhr_.getResponseHeaders();
    Object.keys(responseHeaders).forEach((header) => {
      initialMetadata[header] = responseHeaders[header];
    });
    return initialMetadata;
  }

  /**
   * @private
   * @param {!Uint8Array|string} data Data returned from the underlying stream.
   * @return {!Status} The Rpc Status details.
   */
  parseRpcStatus_(data) {
    let code;
    let message;
    const metadata = {};
    try {
      let rpcStatus;
      if (this.isBinary_) {
        rpcStatus = GoogleRpcStatus.deserializeBinary(data);
      } else {
        asserts.assertString(
            data, 'RPC status must be string in gRPC-Web jspb mode.');
        rpcStatus = GoogleRpcStatus.deserialize(data);
      }
      code = rpcStatus.getCode();
      message = rpcStatus.getMessage();
      if (rpcStatus.getDetailsList().length) {
        metadata['grpc-web-status-details-bin'] = data;
      }
    } catch (e) {
      // 404s may be accompanied by a GoogleRpcStatus. If they are not,
      // the generic message will fail to deserialize because it is not a
      // status.
      if (this.xhr_ && this.xhr_.getStatus() === 404) {
        code = StatusCode.NOT_FOUND;
        message = 'Not Found: ' + this.xhr_.getLastUri();
      } else {
        code = StatusCode.UNAVAILABLE;
        message = 'Unable to parse RpcStatus: ' + e;
      }
    }
    const status = {code: code, details: message, metadata: metadata};
    return status;
  }

  /**
   * @override
   * @export
   */
  on(eventType, callback) {
    // TODO(stanleycheung): change eventType to @enum type
    if (eventType == 'data') {
      this.onDataCallbacks_.push(callback);
    } else if (eventType == 'metadata') {
      this.onMetadataCallbacks_.push(callback);
    } else if (eventType == 'status') {
      this.onStatusCallbacks_.push(callback);
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
    } else if (eventType == 'metadata') {
      this.removeListenerFromCallbacks_(this.onMetadataCallbacks_, callback);
    } else if (eventType == 'status') {
      this.removeListenerFromCallbacks_(this.onStatusCallbacks_, callback);
    } else if (eventType == 'end') {
      this.removeListenerFromCallbacks_(this.onEndCallbacks_, callback);
    } else if (eventType == 'error') {
      this.removeListenerFromCallbacks_(this.onErrorCallbacks_, callback);
    }
    return this;
  }

  /**
   * @override
   * @export
   */
  cancel() {
    this.xhr_.abort();
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
   * @param {!Metadata} metadata The metadata to send back
   */
  sendMetadataCallbacks_(metadata) {
    for (let i = 0; i < this.onMetadataCallbacks_.length; i++) {
      this.onMetadataCallbacks_[i](metadata);
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



exports = StreamBodyClientReadableStream;
