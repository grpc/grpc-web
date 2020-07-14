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

/** @type {string} */
MethodDescriptorInterface.prototype.name;

/** @type {?MethodType} */
MethodDescriptorInterface.prototype.methodType;

/** @type {function(new: REQUEST, ?Array=)} */
MethodDescriptorInterface.prototype.requestType;

/** @type {function(new: RESPONSE, ?Array=)} */
MethodDescriptorInterface.prototype.responseType;

/** @type {function(REQUEST): ?} */
MethodDescriptorInterface.prototype.requestSerializeFn;

/** @type {function(?): RESPONSE} */
MethodDescriptorInterface.prototype.responseDeserializeFn;

/**
 * @template REQUEST, RESPONSE
 * @param {REQUEST} requestMessage
 * @param {!Metadata=} metadata
 * @param {!CallOptions=} callOptions
 * @return {!Request<REQUEST, RESPONSE>}
 */
MethodDescriptorInterface.prototype.createRequest = function(
    requestMessage, metadata, callOptions) {};



/**
 * @template REQUEST, RESPONSE
 * @param {RESPONSE} responseMessage
 * @param {!Metadata=} metadata
 * @param {?Status=} status
 * @return {!UnaryResponse<REQUEST, RESPONSE>}
 */
MethodDescriptorInterface.prototype.createUnaryResponse = function(
    responseMessage, metadata, status) {};

exports = MethodDescriptorInterface;
