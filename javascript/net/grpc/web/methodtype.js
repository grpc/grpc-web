/**
 * @fileoverview Description of this file.
 *
 * grpc web MethodType
 */

goog.module('grpc.web.MethodType');

goog.module.declareLegacyNamespace();

/**
 * See grpc.web.AbstractClientBase.
 * MethodType.UNARY for rpcCall/unaryCall.
 * MethodType.SERVER_STREAMING for serverStreaming.
 *
 * @enum {string}
 */
const MethodType = {
  'UNARY': 'unary',
  'SERVER_STREAMING': 'server_streaming'
};

exports = MethodType;
