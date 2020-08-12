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
 * Base interface for gRPC Web JS clients
 *
 * @author stanleycheung@google.com (Stanley Cheung)
 */
goog.module('grpc.web.AbstractClientBase');

goog.module.declareLegacyNamespace();


const ClientReadableStream = goog.require('grpc.web.ClientReadableStream');
const Error = goog.require('grpc.web.Error');
const MethodDescriptor = goog.require('grpc.web.MethodDescriptor');
const MethodType = goog.require('grpc.web.MethodType');


/**
 * This interface represents a grpc-web client
 * @interface
 */
const AbstractClientBase = class {
  constructor() {}

  /**
   * @abstract
   * @template REQUEST, RESPONSE
   * @param {string} method The method to invoke
   * @param {REQUEST} requestMessage The request proto
   * @param {!Object<string, string>} metadata User defined call metadata
   * @param {!MethodDescriptor<REQUEST, RESPONSE>|
   *     !AbstractClientBase.MethodInfo<REQUEST, RESPONSE>}
   *   methodDescriptor Information of this RPC method
   * @param {function(?Error, ?)}
   *   callback A callback function which takes (error, RESPONSE or null)
   * @return {!ClientReadableStream<RESPONSE>}
   */
  rpcCall(method, requestMessage, metadata, methodDescriptor, callback) {}

  /**
   * @abstract
   * @protected
   * @template REQUEST, RESPONSE
   * @param {string} method The method to invoke
   * @param {REQUEST} requestMessage The request proto
   * @param {!Object<string, string>} metadata User defined call metadata
   * @param {!MethodDescriptor<REQUEST, RESPONSE>|
   *     !AbstractClientBase.MethodInfo<REQUEST,RESPONSE>}
   *   methodDescriptor Information of this RPC method
   * @return {!IThenable <!RESPONSE>}
   *   A promise that resolves to the response message
   */
  thenableCall(method, requestMessage, metadata, methodDescriptor) {}

  /**
   * @abstract
   * @template REQUEST, RESPONSE
   * @param {string} method The method to invoke
   * @param {REQUEST} requestMessage The request proto
   * @param {!Object<string, string>} metadata User defined call metadata
   * @param {!MethodDescriptor<REQUEST, RESPONSE>|
   *     !AbstractClientBase.MethodInfo<REQUEST,RESPONSE>}
   *   methodDescriptor Information of this RPC method
   * @return {!ClientReadableStream<RESPONSE>} The Client Readable Stream
   */
  serverStreaming(method, requestMessage, metadata, methodDescriptor) {}

  /**
   * As MethodType is being deprecated, for now we need to convert MethodType to
   * MethodDescriptor.
   * @static
   * @template REQUEST, RESPONSE
   * @param {string} method
   * @param {REQUEST} requestMessage
   * @param {!MethodType} methodType
   * @param {!AbstractClientBase.MethodInfo<REQUEST,RESPONSE>|!MethodDescriptor<REQUEST,RESPONSE>}
   *     methodInfo
   * @return {!MethodDescriptor<REQUEST,RESPONSE>}
   */
  static ensureMethodDescriptor(
      method, requestMessage, methodType, methodInfo) {
    if (methodInfo instanceof MethodDescriptor) {
      return methodInfo;
    }
    const requestType = methodInfo.requestType || requestMessage.constructor;
    return new MethodDescriptor(
        method, methodType, requestType, methodInfo.responseType,
        methodInfo.requestSerializeFn, methodInfo.responseDeserializeFn);
  }

  /**
   * Get the hostname of the current request.
   * @static
   * @template REQUEST, RESPONSE
   * @param {string} method
   * @param {!MethodDescriptor<REQUEST,RESPONSE>} methodDescriptor
   * @return {string}
   */
  static getHostname(method, methodDescriptor) {
    // method = hostname + methodDescriptor.name(relative path of this method)
    return method.substr(0, method.length - methodDescriptor.name.length);
  }
};


/** @template REQUEST, RESPONSE */
AbstractClientBase.MethodInfo = class {
  /**
   * @param {function(new: RESPONSE, ...)} responseType
   * @param {function(REQUEST): ?} requestSerializeFn
   * @param {function(?): RESPONSE} responseDeserializeFn
   * @param {string=} name
   * @param {function(new: REQUEST, ...)=} requestType
   */
  constructor(
      responseType, requestSerializeFn, responseDeserializeFn, name,
      requestType) {
    /** @const */
    this.name = name;
    /** @const */
    this.requestType = requestType;
    /** @const */
    this.responseType = responseType;
    /** @const */
    this.requestSerializeFn = requestSerializeFn;
    /** @const */
    this.responseDeserializeFn = responseDeserializeFn;
  }
};



exports = AbstractClientBase;
