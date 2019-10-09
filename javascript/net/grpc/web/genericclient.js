/**
 * @fileoverview base interface for grpc web GenericClient.
 */

goog.module('grpc.web.GenericClient');
goog.module.declareLegacyNamespace();

const CallOptions = goog.require('grpc.web.CallOptions');
const Metadata = goog.require('grpc.web.Metadata');
const MethodDescriptor = goog.require('grpc.web.MethodDescriptor');
const UnaryResponse = goog.require('grpc.web.UnaryResponse');

/**
 * @interface
 */
const GenericClient = function() {};


/**
 * @param {!REQUEST} request The request proto message
 * @param {!MethodDescriptor<REQUEST, RESPONSE>} methodDescriptor Information of
 *     this RPC method
 * @param {!Metadata} metadata The user defined request metadata.
 * @param {!CallOptions} callOptions
 * @return {!Promise<!UnaryResponse<RESPONSE>>} A promise that resolves to the
 *     response message and metadata
 * @template REQUEST, RESPONSE
 * @abstract
 */
GenericClient.prototype.unaryCall = function(
    request, methodDescriptor, metadata, callOptions) {};

/**
 * @param {!REQUEST} request The request proto message
 * @param {!MethodDescriptor<REQUEST, RESPONSE>} methodDescriptor Information of
 *     this RPC method
 * @param {!Metadata=} metadata The user defined request metadata.
 * @param {!CallOptions=} callOptions
 * @return {!Promise<RESPONSE>} A promise that resolves to the
 *     response message
 * @template REQUEST, RESPONSE
 * @abstract
 */
GenericClient.prototype.call = function(
    request, methodDescriptor, metadata = {}, callOptions) {};

exports = GenericClient;
