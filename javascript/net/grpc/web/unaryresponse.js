/**
 * @fileoverview gRPC web client UnaryResponse returned by grpc unary calls.
 */

goog.module('grpc.web.UnaryResponse');
goog.module.declareLegacyNamespace();

const Metadata = goog.requireType('grpc.web.Metadata');
const MethodDescriptorInterface = goog.requireType('grpc.web.MethodDescriptorInterface');
const {Status} = goog.requireType('grpc.web.Status');

/**
 * @interface
 * @template REQUEST, RESPONSE
 */
class UnaryResponse {
  /**
   * @export
   * @return {RESPONSE}
   */
  getResponseMessage() {}

  /**
   * @export
   * @return {!Metadata}
   */
  getMetadata() {}

  /**
   * @export
   * @return {!MethodDescriptorInterface<REQUEST, RESPONSE>}
   */
  getMethodDescriptor() {}

  /**
   * gRPC status. Trailer metadata returned from a gRPC server is in
   * status.metadata.
   * @export
   * @return {?Status}
   */
  getStatus() {}
}

exports = UnaryResponse;
