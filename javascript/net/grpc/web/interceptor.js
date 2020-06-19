/**
 * @fileoverview grpc-web client interceptors.
 *
 * The type of interceptors is determined by the response type of the RPC call.
 * gRPC-Web has two generated clients for one service: 
 * FooServiceClient and FooServicePromiseClient. The response type of
 * FooServiceClient is ClientReadableStream for BOTH unary calls and server
 * streaming calls, so StreamInterceptor is expected to be used for intercepting
 * FooServiceClient calls. The response type of PromiseClient is Promise, so use
 * UnaryInterceptor for PromiseClients.
 */

goog.module('grpc.web.Interceptor');
goog.module.declareLegacyNamespace();


const ClientReadableStream = goog.require('grpc.web.ClientReadableStream');
const Request = goog.require('grpc.web.Request');
const UnaryResponse = goog.require('grpc.web.UnaryResponse');

/**
 * Interceptor for RPC calls with response type `UnaryResponse`.
 * An example implementation of UnaryInterceptor
 * <pre>
 * TestUnaryInterceptor.prototype.intercept = function(request, invoker) {
 *   const newRequest = ...
 *   return invoker(newRequest).then((response) => {
 *     // Do something with response.getMetadata
       // Do something with response.getResponseMessage
 *     return response;
 *   });
 * };
 * </pre>
 * @interface
 */
const UnaryInterceptor = function() {};

/**
 * @export
 * @abstract
 * @template REQUEST, RESPONSE
 * @param {!Request<REQUEST, RESPONSE>} request
 * @param {function(!Request<REQUEST,RESPONSE>):!Promise<!UnaryResponse<RESPONSE>>}
 *     invoker
 * @return {!Promise<!UnaryResponse<RESPONSE>>}
 */
UnaryInterceptor.prototype.intercept = function(request, invoker) {};


/**
 * Interceptor for RPC calls with response type `ClientReadableStream`.
 *
 * Two steps to create a stream interceptor:
 * <1>Create a new subclass of ClientReadableStream that wraps around the
 * original stream and overrides its methods. <2>Create a new subclass of
 * StreamInterceptor. While implementing the
 * StreamInterceptor.prototype.intercept method, return the wrapped
 * ClientReadableStream.
 * @interface
 */
const StreamInterceptor = function() {};

/**
 * @export
 * @abstract
 * @template REQUEST, RESPONSE
 * @param {!Request<REQUEST, RESPONSE>} request
 * @param {function(!Request<REQUEST,RESPONSE>):!ClientReadableStream<RESPONSE>}
 *     invoker
 * @return {!ClientReadableStream<RESPONSE>}
 */
StreamInterceptor.prototype.intercept = function(request, invoker) {};


exports = {
  UnaryInterceptor,
  StreamInterceptor
};
