/**
 * @fileoverview grpc-web Interceptor.
 */

goog.module('grpc.web.Interceptor');
goog.module.declareLegacyNamespace();


const ClientReadableStream = goog.require('grpc.web.ClientReadableStream');
const Request = goog.require('grpc.web.Request');
const UnaryResponse = goog.require('grpc.web.UnaryResponse');

/**
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
