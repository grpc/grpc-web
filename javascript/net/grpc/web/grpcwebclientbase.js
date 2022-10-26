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
const ClientOptions = goog.requireType('grpc.web.ClientOptions');
const ClientReadableStream = goog.require('grpc.web.ClientReadableStream');
const ClientUnaryCallImpl = goog.require('grpc.web.ClientUnaryCallImpl');
const GrpcWebClientReadableStream = goog.require('grpc.web.GrpcWebClientReadableStream');
const HttpCors = goog.require('goog.net.rpc.HttpCors');
const MethodDescriptor = goog.requireType('grpc.web.MethodDescriptor');
const Request = goog.require('grpc.web.Request');
const RpcError = goog.require('grpc.web.RpcError');
const StatusCode = goog.require('grpc.web.StatusCode');
const XhrIo = goog.require('goog.net.XhrIo');
const googCrypt = goog.require('goog.crypt.base64');
const {Status} = goog.require('grpc.web.Status');
const {StreamInterceptor, UnaryInterceptor} = goog.require('grpc.web.Interceptor');
const {toObject} = goog.require('goog.collections.maps');



/**
 * Base class for gRPC web client using the application/grpc-web wire format
 * @implements {AbstractClientBase}
 * @unrestricted
 */
class GrpcWebClientBase {
  /**
   * @param {!ClientOptions=} options
   * @param {!XhrIo=} xhrIo
   */
  constructor(options = {}, xhrIo = undefined) {
    /**
     * @const
     * @private {string}
     */
    this.format_ =
        options.format || goog.getObjectByName('format', options) || 'text';

    /**
     * @const
     * @private {boolean}
     */
    this.suppressCorsPreflight_ = options.suppressCorsPreflight ||
        goog.getObjectByName('suppressCorsPreflight', options) || false;

    /**
     * @const
     * @private {boolean}
     */
    this.withCredentials_ = options.withCredentials ||
        goog.getObjectByName('withCredentials', options) || false;

    /**
     * @const {!Array<!StreamInterceptor>}
     * @private
     */
    this.streamInterceptors_ = options.streamInterceptors ||
        goog.getObjectByName('streamInterceptors', options) || [];

    /**
     * @const {!Array<!UnaryInterceptor>}
     * @private
     */
    this.unaryInterceptors_ = options.unaryInterceptors ||
        goog.getObjectByName('unaryInterceptors', options) || [];

    /** @const @private {?XhrIo} */
    this.xhrIo_ = xhrIo || null;
  }

  /**
   * @override
   * @export
   */
  rpcCall(method, requestMessage, metadata, methodDescriptor, callback) {
    const hostname = AbstractClientBase.getHostname(method, methodDescriptor);
    const invoker = GrpcWebClientBase.runInterceptors_(
        (request) => this.startStream_(request, hostname),
        this.streamInterceptors_);
    const stream = /** @type {!ClientReadableStream<?>} */ (invoker.call(
        this, methodDescriptor.createRequest(requestMessage, metadata)));
    GrpcWebClientBase.setCallback_(stream, callback, false);
    return new ClientUnaryCallImpl(stream);
  }

  /**
   * @override
   * @export
   */
  thenableCall(method, requestMessage, metadata, methodDescriptor) {
    const hostname = AbstractClientBase.getHostname(method, methodDescriptor);
    const initialInvoker = (request) => new Promise((resolve, reject) => {
      const stream = this.startStream_(request, hostname);
      let unaryMetadata;
      let unaryStatus;
      let unaryMsg;
      GrpcWebClientBase.setCallback_(
          stream, (error, response, status, metadata, unaryResponseReceived) => {
            if (error) {
              reject(error);
            } else if (unaryResponseReceived) {
              unaryMsg = response;
            } else if (status) {
              unaryStatus = status;
            } else if (metadata) {
              unaryMetadata = metadata;
            } else {
              resolve(request.getMethodDescriptor().createUnaryResponse(
                  unaryMsg, unaryMetadata, unaryStatus));
            }
          }, true);
    });
    const invoker = GrpcWebClientBase.runInterceptors_(
        initialInvoker, this.unaryInterceptors_);
    const unaryResponse = /** @type {!Promise<?>} */ (invoker.call(
        this, methodDescriptor.createRequest(requestMessage, metadata)));
    return unaryResponse.then((response) => response.getResponseMessage());
  }

  /**
   * @export
   * @param {string} method The method to invoke
   * @param {REQUEST} requestMessage The request proto
   * @param {!Object<string, string>} metadata User defined call metadata
   * @param {!MethodDescriptor<REQUEST, RESPONSE>} methodDescriptor Information
   *     of this RPC method
   * @return {!Promise<RESPONSE>}
   * @template REQUEST, RESPONSE
   */
  unaryCall(method, requestMessage, metadata, methodDescriptor) {
    return /** @type {!Promise<RESPONSE>}*/ (
        this.thenableCall(method, requestMessage, metadata, methodDescriptor));
  }

  /**
   * @override
   * @export
   */
  serverStreaming(method, requestMessage, metadata, methodDescriptor) {
    const hostname = AbstractClientBase.getHostname(method, methodDescriptor);
    const invoker = GrpcWebClientBase.runInterceptors_(
        (request) => this.startStream_(request, hostname),
        this.streamInterceptors_);
    return /** @type {!ClientReadableStream<?>} */ (invoker.call(
        this, methodDescriptor.createRequest(requestMessage, metadata)));
  }

  /**
   * @private
   * @template REQUEST, RESPONSE
   * @param {!Request<REQUEST, RESPONSE>} request
   * @param {string} hostname
   * @return {!ClientReadableStream<RESPONSE>}
   */
  startStream_(request, hostname) {
    const methodDescriptor = request.getMethodDescriptor();
    let path = hostname + methodDescriptor.getName();

    const xhr = this.xhrIo_ ? this.xhrIo_ : new XhrIo();
    xhr.setWithCredentials(this.withCredentials_);

    const genericTransportInterface = {
      xhr: xhr,
    };
    const stream = new GrpcWebClientReadableStream(genericTransportInterface);
    stream.setResponseDeserializeFn(
        methodDescriptor.getResponseDeserializeFn());

    const metadata = request.getMetadata();
    for(const key in metadata) {
      xhr.headers.set(key, metadata[key]);
    }
    this.processHeaders_(xhr);
    if (this.suppressCorsPreflight_) {
      const headerObject = toObject(xhr.headers);
      xhr.headers.clear();
      path = GrpcWebClientBase.setCorsOverride_(path, headerObject);
    }

    const requestSerializeFn = methodDescriptor.getRequestSerializeFn();
    const serialized = requestSerializeFn(request.getRequestMessage());
    let payload = this.encodeRequest_(serialized);
    if (this.format_ == 'text') {
      payload = googCrypt.encodeByteArray(payload);
    } else if (this.format_ == 'binary') {
      xhr.setResponseType(XhrIo.ResponseType.ARRAY_BUFFER);
    }
    xhr.send(path, 'POST', payload);
    return stream;
  }

  /**
   * @private
   * @static
   * @template RESPONSE
   * @param {!ClientReadableStream<RESPONSE>} stream
   * @param {function(?RpcError, ?RESPONSE, ?Status=, ?Object<string, string>=, ?boolean)|
   *     function(?RpcError,?RESPONSE)} callback
   * @param {boolean} useUnaryResponse Pass true to have the client make
   * multiple calls to the callback, using (error, response, status,
   * metadata, unaryResponseReceived) arguments. One of error, status,
   * metadata, or unaryResponseReceived will be truthy to indicate which piece
   * of information the client is providing in that call. After the stream
   * ends, it will call the callback an additional time with all falsy
   * arguments. Pass false to have the client make one call to the callback
   * using (error, response) arguments.
   */
  static setCallback_(stream, callback, useUnaryResponse) {
    let isResponseReceived = false;
    let responseReceived = null;
    let errorEmitted = false;

    stream.on('data', function(response) {
      isResponseReceived = true;
      responseReceived = response;
    });

    stream.on('error', function(error) {
      if (error.code != StatusCode.OK && !errorEmitted) {
        errorEmitted = true;
        callback(error, null);
      }
    });

    stream.on('status', function(status) {
      if (status.code != StatusCode.OK && !errorEmitted) {
        errorEmitted = true;
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
    }

    stream.on('end', function() {
      if (!errorEmitted) {
        if (!isResponseReceived) {
          callback({
            code: StatusCode.UNKNOWN,
            message: 'Incomplete response',
          });
        } else if (useUnaryResponse) {
          callback(null, responseReceived, null, null, /* unaryResponseReceived= */ true);
        } else {
          callback(null, responseReceived);
        }
      }
      if (useUnaryResponse) {
        callback(null, null);
      }
    });
  }

  /**
   * Encode the grpc-web request
   *
   * @private
   * @param {!Uint8Array} serialized The serialized proto payload
   * @return {!Uint8Array} The application/grpc-web padded request
   */
  encodeRequest_(serialized) {
    let len = serialized.length;
    const bytesArray = [0, 0, 0, 0];
    const payload = new Uint8Array(5 + len);
    for (let i = 3; i >= 0; i--) {
      bytesArray[i] = (len % 256);
      len = len >>> 8;
    }
    payload.set(new Uint8Array(bytesArray), 1);
    payload.set(serialized, 5);
    return payload;
  }

  /**
   * @private
   * @param {!XhrIo} xhr The xhr object
   */
  processHeaders_(xhr) {
    if (this.format_ == 'text') {
      xhr.headers.set('Content-Type', 'application/grpc-web-text');
      xhr.headers.set('Accept', 'application/grpc-web-text');
    } else {
      xhr.headers.set('Content-Type', 'application/grpc-web+proto');
    }
    xhr.headers.set('X-User-Agent', 'grpc-web-javascript/0.1');
    xhr.headers.set('X-Grpc-Web', '1');
    if (xhr.headers.has('deadline')) {
      const deadline = Number(xhr.headers.get('deadline'));  // in ms
      const currentTime = (new Date()).getTime();
      let timeout = Math.ceil(deadline - currentTime);
      xhr.headers.delete('deadline');
      if (timeout === Infinity) {
        // grpc-timeout header defaults to infinity if not set.
        timeout = 0;
      }
      if (timeout > 0) {
        xhr.headers.set('grpc-timeout', timeout + 'm');
        // Also set timeout on the xhr request to terminate the HTTP request
        // if the server doesn't respond within the deadline. We use 110% of
        // grpc-timeout for this to allow the server to terminate the connection
        // with DEADLINE_EXCEEDED rather than terminating it in the Browser, but
        // at least 1 second in case the user is on a high-latency network.
        xhr.setTimeoutInterval(Math.max(1000, Math.ceil(timeout * 1.1)));
      }
    }
  }

  /**
   * @private
   * @static
   * @param {string} method The method to invoke
   * @param {!Object<string,string>} headerObject The xhr headers
   * @return {string} The URI object or a string path with headers
   */
  static setCorsOverride_(method, headerObject) {
    return /** @type {string} */ (HttpCors.setHttpHeadersWithOverwriteParam(
        method, HttpCors.HTTP_HEADERS_PARAM_NAME, headerObject));
  }

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
  static runInterceptors_(invoker, interceptors) {
    let curInvoker = invoker;
    interceptors.forEach((interceptor) => {
      const lastInvoker = curInvoker;
      curInvoker = (request) => interceptor.intercept(request, lastInvoker);
    });
    return curInvoker;
  }
}



exports = GrpcWebClientBase;
