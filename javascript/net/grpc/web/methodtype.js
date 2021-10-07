/**
 * @fileoverview gRPC-Web method types.
 */

goog.module('grpc.web.MethodType');

goog.module.declareLegacyNamespace();

/**
 * Available method types:
 * MethodType.UNARY: unary request and unary response.
 * MethodType.SERVER_STREAMING: unary request and streaming responses.
 * MethodType.BIDI_STREAMING: streaming requests and streaming responses.
 *
 * @enum {string}
 */
const MethodType = {
  'UNARY': 'unary',
  'SERVER_STREAMING': 'server_streaming',
  // Bidi streaming is experimental. Do not use.
  'BIDI_STREAMING': 'bidi_streaming',
};

exports = MethodType;
