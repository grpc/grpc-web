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
const ClientReadableStreamDelegate = goog.require('grpc.web.ClientReadableStreamDelegate');
const DefaultClientReadableStreamDelegate = goog.require('grpc.web.DefaultClientReadableStreamDelegate');
const ErrorCode = goog.require('goog.net.ErrorCode');
const NodeReadableStream = goog.require('goog.net.streams.NodeReadableStream');
const StatusCode = goog.require('grpc.web.StatusCode');
const XhrIo = goog.require('goog.net.XhrIo');
const {GenericTransportInterface} = goog.require('grpc.web.GenericTransportInterface');
const {Status} = goog.require('grpc.web.Status');
const {assertInstanceof} = goog.require('goog.asserts');



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
   * @type {!ClientReadableStreamDelegate<RESPONSE>}
   */
  this.delegate_ = new DefaultClientReadableStreamDelegate();

  /**
   * @private
   * @type {function(?):!Status|null}
   *   A function to parse the Rpc Status response
   */
  this.rpcStatusParseFn_ = null;


  // Add the callback to the underlying stream
  this.xhrNodeReadableStream_.on('data', (data) => {
    if ('1' in data) {
      const response = this.responseDeserializeFn_(data['1']);
      this.delegate_.onData(response);
    }
    if ('2' in data) {
      const status = this.rpcStatusParseFn_(data['2']);
      this.delegate_.onStatus(status);
    }
  });
  this.xhrNodeReadableStream_.on('end', () => {
    this.delegate_.onEnd();
  });
  this.xhrNodeReadableStream_.on('error', () => {
    const lastErrorCode = this.xhr_.getLastErrorCode();
    if (lastErrorCode == ErrorCode.NO_ERROR) {
      return;
    }
    this.delegate_.onError({
      code: StatusCode.UNAVAILABLE,
      message: ErrorCode.getDebugMessage(lastErrorCode)
    });
  });
};


/**
 * @override
 *
 * @suppress {checkTypes}
 */
StreamBodyClientReadableStream.prototype.on = function(eventType, callback) {
  assertInstanceof(
      this.delegate_, DefaultClientReadableStreamDelegate,
      'Cannot call StreamBodyClientReadableStream.on with custom delegate');

  // TODO(stanleycheung): change eventType to @enum type
  if (eventType == 'data') {
    this.delegate_.setOnData(callback);
  } else if (eventType == 'end') {
    this.delegate_.setOnEnd(callback);
  } else if (eventType == 'error') {
    this.delegate_.setOnError(callback);
  } else if (eventType == 'status') {
    this.delegate_.setOnStatus(callback);
  }
  return this;
};


/**
 * @override
 */
StreamBodyClientReadableStream.prototype.setDelegate = function(delegate) {
  this.delegate_ = delegate;
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
StreamBodyClientReadableStream.prototype.setRpcStatusParseFn =
    function(rpcStatusParseFn) {
  this.rpcStatusParseFn_ = rpcStatusParseFn;
};


/**
 * @override
 */
StreamBodyClientReadableStream.prototype.cancel = function() {
  this.xhr_.abort();
};



exports = StreamBodyClientReadableStream;
