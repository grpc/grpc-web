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
goog.provide('grpc.web.AbstractClientBase');


goog.require('grpc.web.Error');



/**
 * This interface represents a grpc-web client
 *
 * @interface
 */
grpc.web.AbstractClientBase = function() {};


/**
 * @constructor
 * @struct
 * @template REQUEST, RESPONSE
 * @param {function(new: RESPONSE, ...)} responseType
 * @param {function(REQUEST): ?} requestSerializeFn
 * @param {function(?): RESPONSE} responseDeserializeFn
 */
grpc.web.AbstractClientBase.MethodInfo = function(
    responseType,
    requestSerializeFn,
    responseDeserializeFn) {
  /** @const */
  this.responseType = responseType;
  /** @const */
  this.requestSerializeFn = requestSerializeFn;
  /** @const */
  this.responseDeserializeFn = responseDeserializeFn;
};


/**
 * @template REQUEST, RESPONSE
 * Even with ?RESPONSE the RESPONSE will still be inferred as
 * "FooResponse|Null". Use RESPONSE_LEAN to extract out the "FooResponse"
 * part. See go/closure-ttl.
 * @template RESPONSE_LEAN :=
 *     cond(isUnknown(RESPONSE), unknown(),
 *       mapunion(RESPONSE, (X) =>
 *         cond(eq(X, 'undefined'), none(),
 *         cond(eq(X, 'null'), none(),
 *         X))))
 * =:
 * @param {!string} method The method to invoke
 * @param {REQUEST} request The request proto
 * @param {!Object<string, string>} metadata User defined call metadata
 * @param {!grpc.web.AbstractClientBase.MethodInfo<REQUEST, RESPONSE_LEAN>}
 *   methodInfo Information of this RPC method
 * @param {function(?grpc.web.Error, ?RESPONSE)}
 *   callback A callback function which takes (error, response)
 * @return {!grpc.web.ClientReadableStream<RESPONSE_LEAN>|undefined}
 *   The Client Readable Stream
 */
grpc.web.AbstractClientBase.prototype.rpcCall = goog.abstractMethod;


/**
 * @template REQUEST, RESPONSE
 * @param {!string} method The method to invoke
 * @param {REQUEST} request The request proto
 * @param {!Object<string, string>} metadata User defined call metadata
 * @param {!grpc.web.AbstractClientBase.MethodInfo<REQUEST, RESPONSE>}
 *   methodInfo Information of this RPC method
 * @return {!grpc.web.ClientReadableStream<RESPONSE>} The Client Readable Stream
 */
grpc.web.AbstractClientBase.prototype.serverStreaming = goog.abstractMethod;
