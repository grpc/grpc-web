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
 * @fileoverview A generic gRPC-Web client customized for Protobuf.js.
 *
 * (This API is experimental and subject to change.)
 *
 * @author updogliu@google.com (Zihan Liu)
 */

// TODO(updogliu): add support of server streaming request.

goog.module('grpc.web.util.GenericPbjsClient');

var AbstractClientBase = goog.require('grpc.web.AbstractClientBase');
var Error = goog.require('grpc.web.Error');
var GatewayClientBase = goog.require('grpc.web.GatewayClientBase');


/**
 * A generic gRPC-Web client customized for Protobuf.js
 *
 * @param {string} hostname The hostname of the server
 * @constructor
 * @struct
 * @final
 */
var GenericPbjsClient = function(hostname) {

  /**
   * The underlying client base
   * @private @const {!GatewayClientBase}
   */
  this.clientBase_ = new GatewayClientBase();

  /**
   * The hostname of the server
   * @private {string}
   */
  this.hostname_ = hostname;
};


/**
 * Get the full name (without the leading dot) of the service of the method.
 *
 * @param {!Object} method The method (a Protobuf.js Method object)
 * @return {string} The full name of the service containing the method
 * @suppress {missingProperties}
 * @suppress {strictMissingProperties}
 */
function getServiceName(method) {
  var fullName = method.parent.fullName;
  if (fullName.startsWith('.')) {
    fullName = fullName.substring(1);
  }
  return fullName;
}


/**
 * @param {!Object} method
 *     The method to invoke (an instance of Protobuf.js Method)
 * @param {!Object} request
 *     The request (an instance of Protobuf.js Message or a payload object)
 * @param {!Object<string, string>} metadata User defined call metadata
 * @param {function(?Error, ?Object)} callback A callback function
 *     which takes (error, response)
 * @suppress {missingProperties}
 * @suppress {strictMissingProperties}
 */
GenericPbjsClient.prototype.rpcCall = function(
    method, request, metadata, callback) {
  method.resolve();
  var requestType = method.resolvedRequestType;
  var responseType = method.resolvedResponseType;

  var methodInfo = /** @type {!AbstractClientBase.MethodInfo<?, ?>} */ ({
    requestSerializeFn: function(request) {
      return requestType.encode(request).finish();
    },
    responseDeserializeFn: function(payload) {
      return responseType.decode(payload);
    }
  });

  // Make a gRPC-Web call.
  var url = this.hostname_ + '/' + getServiceName(method) + '/' + method.name;
  this.clientBase_.rpcCall(url, request, metadata, methodInfo, callback);
};


exports = GenericPbjsClient;
