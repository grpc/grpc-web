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
 * @fileoverview gRPC browser client library.
 *
 * Base class for gRPC Web JS clients using the application/grpc-web wire
 * format
 *
 * @author stanleycheung@google.com (Stanley Cheung)
 */
goog.module('grpc.web.GrpcWebClientBase');

goog.module.declareLegacyNamespace();


const AbstractClientBase = goog.require('grpc.web.AbstractClientBase');
const ClientReadableStream = goog.require('grpc.web.ClientReadableStream');
const Error = goog.require('grpc.web.Error');
const GrpcWebClientReadableStream = goog.require('grpc.web.GrpcWebClientReadableStream');
const HttpCors = goog.require('goog.net.rpc.HttpCors');
const MethodType = goog.require('grpc.web.MethodType');
const Request = goog.require('grpc.web.Request');
const StatusCode = goog.require('grpc.web.StatusCode');
const UnaryResponse = goog.require('grpc.web.UnaryResponse');
const XhrIo = goog.require('goog.net.XhrIo');
const googCrypt = goog.require('goog.crypt.base64');
const {Status} = goog.require('grpc.web.Status');
const {StreamInterceptor, UnaryInterceptor} = goog.require('grpc.web.Interceptor');



/**
 * Base class for gRPC web client using the application/grpc-web wire format
 * @param {?Object=} opt_options
 * @constructor
 * @implements {AbstractClientBase}
 */
const GrpcWebClientBase = function(opt_options) {
  /**
   * @const
   * @private {string}
   */
  this.format_ =
    goog.getObjectByName('format', opt_options) || "text";

  /**
   * @const
   * @private {boolean}
   */
  this.suppressCorsPreflight_ =
    goog.getObjectByName('suppressCorsPreflight', opt_options) || false;


  /**
   * @const
   * @private {boolean}
   */
  this.withCredentials_ =
    goog.getObjectByName('withCredentials', opt_options) || false;
  /**
   * @const {!Array<!StreamInterceptor>}
   * @private
   */
  this.streamInterceptors_ =
      goog.getObjectByName('streamInterceptors', opt_options) || [];


  /**
   * @const {!Array<!UnaryInterceptor>}
   * @private
   */
  this.unaryInterceptors_ =
      goog.getObjectByName('unaryInterceptors', opt_options) || [];
};


/**
 * @override
 * @export
 */
GrpcWebClientBase.prototype.rpcCall = function(
    method, requestMessage, metadata, methodDescriptor, callback) {
  methodDescriptor = AbstractClientBase.ensureMethodDescriptor(
      method, requestMessage, MethodType.UNARY, methodDescriptor);
  var hostname = AbstractClientBase.getHostname(method, methodDescriptor);
  var invoker = GrpcWebClientBase.runInterceptors_(
      (request) => this.startStream_(request, hostname),
      this.streamInterceptors_);
  var stream = /** @type {!ClientReadableStream<?>} */ (invoker.call(
      this, methodDescriptor.createRequest(requestMessage, metadata)));
  GrpcWebClientBase.setCallback_(stream, callback, false);
  return stream;
};


/**
 * @override
 * @export
 */
GrpcWebClientBase.prototype.unaryCall = function(
    method, requestMessage, metadata, methodDescriptor) {
  methodDescriptor = AbstractClientBase.ensureMethodDescriptor(
      method, requestMessage, MethodType.UNARY, methodDescriptor);
  var hostname = AbstractClientBase.getHostname(method, methodDescriptor);
  var initialInvoker = (request) => new Promise((resolve, reject) => {
    var stream = this.startStream_(request, hostname);
    var unaryMetadata;
    var unaryStatus;
    var unaryMsg;
    GrpcWebClientBase.setCallback_(
        stream, (error, response, status, metadata) => {
          if (error) {
            reject(error);
          } else if (response) {
            unaryMsg = response;
          } else if (status) {
            unaryStatus = status;
          } else if (metadata) {
            unaryMetadata = metadata;
          } else {
            resolve(new UnaryResponse(unaryMsg, unaryMetadata, unaryStatus));
          }
        }, true);
  });
  var invoker = GrpcWebClientBase.runInterceptors_(
      initialInvoker, this.unaryInterceptors_);
  var unaryResponse = /** @type {!Promise<?>} */ (invoker.call(
      this, methodDescriptor.createRequest(requestMessage, metadata)));
  return unaryResponse.then((response) => response.getResponseMessage());
};


/**
 * @override
 * @export
 */
GrpcWebClientBase.prototype.serverStreaming = function(
    method, requestMessage, metadata, methodDescriptor) {
  methodDescriptor = AbstractClientBase.ensureMethodDescriptor(
      method, requestMessage, MethodType.SERVER_STREAMING, methodDescriptor);
  var hostname = AbstractClientBase.getHostname(method, methodDescriptor);
  var invoker = GrpcWebClientBase.runInterceptors_(
      (request) => this.startStream_(request, hostname),
      this.streamInterceptors_);
  return /** @type {!ClientReadableStream<?>} */ (invoker.call(
      this, methodDescriptor.createRequest(requestMessage, metadata)));
};


/**
 * @private
 * @template REQUEST, RESPONSE
 * @param {!Request<REQUEST, RESPONSE>} request
 * @param {string} hostname
 * @return {!ClientReadableStream<RESPONSE>}
 */
GrpcWebClientBase.prototype.startStream_ = function(request, hostname) {
  var methodDescriptor = request.getMethodDescriptor();
  var path = hostname + methodDescriptor.name;

  var xhr = this.newXhr_();
  xhr.setWithCredentials(this.withCredentials_);

  var genericTransportInterface = {
    xhr: xhr,
  };
  var stream = new GrpcWebClientReadableStream(genericTransportInterface);
  stream.setResponseDeserializeFn(methodDescriptor.responseDeserializeFn);

  xhr.headers.addAll(request.getMetadata());
  this.processHeaders_(xhr);
  if (this.suppressCorsPreflight_) {
    var headerObject = xhr.headers.toObject();
    xhr.headers.clear();
    path = GrpcWebClientBase.setCorsOverride_(path, headerObject);
  }

  var serialized =
      methodDescriptor.requestSerializeFn(request.getRequestMessage());
  var payload = this.encodeRequest_(serialized);
  if (this.format_ == 'text') {
    payload = googCrypt.encodeByteArray(payload);
  } else if (this.format_ == 'binary') {
    xhr.setResponseType(XhrIo.ResponseType.ARRAY_BUFFER);
  }
  xhr.send(path, 'POST', payload);
  return stream;
};


/**
 * @private
 * @static
 * @template RESPONSE
 * @param {!ClientReadableStream<RESPONSE>} stream
 * @param {function(?Error, ?RESPONSE, ?Status=, ?Metadata=)|
 *     function(?Error,?RESPONSE)} callback
 * @param {boolean} useUnaryResponse
 */
GrpcWebClientBase.setCallback_ = function(stream, callback, useUnaryResponse) {
  stream.on('data', function(response) {
    callback(null, response);
  });

  stream.on('error', function(error) {
    if (error.code != StatusCode.OK) {
      callback(error, null);
    }
  });

  stream.on('status', function(status) {
    if (status.code != StatusCode.OK) {
      callback(
          {
            code: status.code,
            message: status.details,
            metadata: status.metadata
          },
          null);
    } else if (useUnaryResponse) {
      callback(null, null, status);
    }
  });

  if (useUnaryResponse) {
    stream.on('metadata', function(metadata) {
      callback(null, null, null, metadata);
    });

    stream.on('end', function() {
      callback(null, null);
    });
  }
};

/**
 * Create a new XhrIo object
 *
 * @private
 * @return {!XhrIo} The created XhrIo object
 */
GrpcWebClientBase.prototype.newXhr_ = function() {
  return new XhrIo();
};

/**
 * Encode the grpc-web request
 *
 * @private
 * @param {!Uint8Array} serialized The serialized proto payload
 * @return {!Uint8Array} The application/grpc-web padded request
 */
GrpcWebClientBase.prototype.encodeRequest_ = function(serialized) {
  var len = serialized.length;
  var bytesArray = [0, 0, 0, 0];
  var payload = new Uint8Array(5 + len);
  for (var i = 3; i >= 0; i--) {
    bytesArray[i] = (len % 256);
    len = len >>> 8;
  }
  payload.set(new Uint8Array(bytesArray), 1);
  payload.set(serialized, 5);
  return payload;
};

/**
 * @private
 * @param {!XhrIo} xhr The xhr object
 */
GrpcWebClientBase.prototype.processHeaders_ = function(xhr) {
  if (this.format_ == "text") {
    xhr.headers.set('Content-Type', 'application/grpc-web-text');
    xhr.headers.set('Accept', 'application/grpc-web-text');
  } else {
    xhr.headers.set('Content-Type', 'application/grpc-web+proto');
  }
  xhr.headers.set('X-User-Agent', 'grpc-web-javascript/0.1');
  xhr.headers.set('X-Grpc-Web', '1');
  if (xhr.headers.containsKey('deadline')) {
    var deadline = xhr.headers.get('deadline'); // in ms
    var currentTime = (new Date()).getTime();
    var timeout = Math.round(deadline - currentTime);
    xhr.headers.remove('deadline');
    if (timeout === Infinity) {
      // grpc-timeout header defaults to infinity if not set.
      timeout = 0;
    }
    if (timeout > 0) {
      xhr.headers.set('grpc-timeout', timeout + 'm');
    }
  }
};

/**
 * @private
 * @static
 * @param {string} method The method to invoke
 * @param {!Object<string,string>} headerObject The xhr headers
 * @return {string} The URI object or a string path with headers
 */
GrpcWebClientBase.setCorsOverride_ = function(method, headerObject) {
  return /** @type {string} */  (HttpCors.setHttpHeadersWithOverwriteParam(
    method, HttpCors.HTTP_HEADERS_PARAM_NAME, headerObject));
};

/**
 * @private
 * @static
 * @template REQUEST, RESPONSE
 * @param {function(!Request<REQUEST,RESPONSE>):
 *     (!Promise<RESPONSE>|!ClientReadableStream<RESPONSE>)} invoker
 * @param {!Array<!UnaryInterceptor|!StreamInterceptor>}
 *     interceptors
 * @return {function(!Request<REQUEST,RESPONSE>):
 *     (!Promise<RESPONSE>|!ClientReadableStream<RESPONSE>)}
 */
GrpcWebClientBase.runInterceptors_ = function(invoker, interceptors) {
  let curInvoker = invoker;
  interceptors.forEach((interceptor) => {
    const lastInvoker = curInvoker;
    curInvoker = (request) => interceptor.intercept(request, lastInvoker);
  });
  return curInvoker;
};
exports = GrpcWebClientBase;
