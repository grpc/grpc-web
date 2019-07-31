/**
 * @fileoverview gRPC web client UnaryResponse returned the by grpc unary calls.
 * It consists of response message and response metadata(headers).
 */

goog.module('grpc.web.UnaryResponse');
goog.module.declareLegacyNamespace();

const Metadata = goog.require('grpc.web.Metadata');

/**
 * @constructor
 * @struct
 * @template RESPONSE
 * @param {RESPONSE} message
 * @param {!Metadata=} metadata
 */
const UnaryResponse = function(message, metadata) {
  /** @const {RESPONSE} */
  this.message = message;
  /** @const {!Metadata|undefined} */
  this.metadata = metadata;
};

exports = UnaryResponse;
