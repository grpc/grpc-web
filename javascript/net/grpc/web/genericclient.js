/**
 * @fileoverview base interface for grpc web GenericClient.
 */

goog.module('grpc.web.GenericClient');
goog.module.declareLegacyNamespace();

const MethodDescriptor = goog.require('grpc.web.MethodDescriptor');
const Request = goog.require('grpc.web.Request');
const UnaryResponse = goog.require('grpc.web.UnaryResponse');

/**
 * @interface
 */
const GenericClient = function() {};


/**
 * @param {!Request<REQUEST, RESPONSE>} request The wrapped gRPC-Web request
 * @return {!Promise<!UnaryResponse<RESPONSE>>} A promise that resolves to the
 *     response message and metadata
 * @template REQUEST, RESPONSE
 * @abstract
 */
GenericClient.prototype.unaryCall = function(request) {};

/**
 * Simplified version of GenericClient.prototype.unaryCall. Users are expected
 * to use this method if they don't have the need to customize metadata and
 * callOptions .
 * @param {!REQUEST} requestMessage The request message
 * @param {!MethodDescriptor<REQUEST, RESPONSE>} methodDescriptor Information of
 *     this RPC method
 * @return {!Promise<RESPONSE>} A promise that resolves to the
 *     response message
 * @template REQUEST, RESPONSE
 * @abstract
 */
GenericClient.prototype.call = function(requestMessage, methodDescriptor) {};

exports = GenericClient;
