/**
 * @fileoverview Description of this file.
 *
 * A templated class that is used to address gRPC Web requests.
 */

goog.module('grpc.web.MethodDescriptor');
goog.module.declareLegacyNamespace();

/**
 * @constructor
 * @struct
 * @template REQUEST, RESPONSE
 * @param {string} name
 * @param {!MethodDescriptor.MethodType} methodType
 * @param {function(new: REQUEST, ...)} requestType
 * @param {function(new: RESPONSE, ...)} responseType
 * @param {function(REQUEST): ?} requestSerializeFn
 * @param {function(?): RESPONSE} responseDeserializeFn
 */
const MethodDescriptor = function(
    name, methodType, requestType, responseType, requestSerializeFn,
    responseDeserializeFn) {
  /** @const */
  this.name = name;
  /** @const */
  this.methodType = methodType;
  /** @const */
  this.requestType = requestType;
  /** @const */
  this.responseType = responseType;
  /** @const */
  this.requestSerializeFn = requestSerializeFn;
  /** @const */
  this.responseDeserializeFn = responseDeserializeFn;
};

/**
 * @enum {string}
 */
MethodDescriptor.MethodType = {
  'UNARY': 'unary',
  'SERVER_STREAMING': 'server_streaming'
};

exports = MethodDescriptor;
