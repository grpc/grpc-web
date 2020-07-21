/**
 * @fileoverview Description of this file.
 *
 * A templated class that is used to address gRPC Web requests.
 */

goog.module('grpc.web.MethodDescriptorInterface');
goog.module.declareLegacyNamespace();

const CallOptions = goog.requireType('grpc.web.CallOptions');
const Metadata = goog.requireType('grpc.web.Metadata');
const MethodType = goog.requireType('grpc.web.MethodType');
const Request = goog.requireType('grpc.web.Request');
const UnaryResponse = goog.requireType('grpc.web.UnaryResponse');
const {Status} = goog.requireType('grpc.web.Status');

/**
 * @interface
 * @template REQUEST, RESPONSE
 */
const MethodDescriptorInterface = function() {};

/**
 * @param {REQUEST} requestMessage
 * @param {!Metadata=} metadata
 * @param {!CallOptions=} callOptions
 * @return {!Request<REQUEST, RESPONSE>}
 */
MethodDescriptorInterface.prototype.createRequest = function(
    requestMessage, metadata, callOptions) {};


/**
 * @param {RESPONSE} responseMessage
 * @param {!Metadata=} metadata
 * @param {?Status=} status
 * @return {!UnaryResponse<REQUEST, RESPONSE>}
 */
MethodDescriptorInterface.prototype.createUnaryResponse = function(
    responseMessage, metadata, status) {};

/** @return {string} */
MethodDescriptorInterface.prototype.getName = function() {};

/** @return {?MethodType} */
MethodDescriptorInterface.prototype.getMethodType = function() {};

/** @return {function(new: RESPONSE, ?Array=)} */
MethodDescriptorInterface.prototype.getResponseMessageCtor = function() {};

/** @return {function(new: REQUEST, ?Array=)} */
MethodDescriptorInterface.prototype.getRequestMessageCtor = function() {};

/** @return {function(?): RESPONSE} */
MethodDescriptorInterface.prototype.getResponseDeserializeFn = function() {};

/** @return {function(REQUEST): ?} */
MethodDescriptorInterface.prototype.getRequestSerializeFn = function() {};

exports = MethodDescriptorInterface;
