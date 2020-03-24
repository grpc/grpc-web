/**
 * @fileoverview Description of this file.
 *
 * A templated class that is used to address gRPC Web requests.
 */

goog.module('grpc.web.MethodDescriptor');
goog.module.declareLegacyNamespace();

const CallOptions = goog.require('grpc.web.CallOptions');
const Metadata = goog.require('grpc.web.Metadata');
const MethodType = goog.require('grpc.web.MethodType');
const Request = goog.require('grpc.web.Request');
const RequestInternal = goog.require('grpc.web.RequestInternal');

/**
 * @constructor
 * @struct
 * @template REQUEST, RESPONSE
 * @param {string} name
 * @param {!MethodType} methodType
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
 * @template REQUEST, RESPONSE
 * @param {REQUEST} requestMessage
 * @param {!Metadata=} metadata
 * @param {!CallOptions=} callOptions
 * @return {!Request<REQUEST, RESPONSE>}
 */
MethodDescriptor.prototype.createRequest = function(
    requestMessage, metadata = {}, callOptions = new CallOptions()) {
  return new RequestInternal(requestMessage, this, metadata, callOptions);
};

exports = MethodDescriptor;
