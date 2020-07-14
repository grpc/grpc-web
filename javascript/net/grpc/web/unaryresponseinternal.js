/**
 * @fileoverview gRPC-Web UnaryResponse internal implementation.
 */

goog.module('grpc.web.UnaryResponseInternal');
goog.module.declareLegacyNamespace();

const Metadata = goog.requireType('grpc.web.Metadata');
const MethodDescriptor = goog.requireType('grpc.web.MethodDescriptor');
const UnaryResponse = goog.requireType('grpc.web.UnaryResponse');
const {Status} = goog.requireType('grpc.web.Status');

/**
 * @template REQUEST, RESPONSE
 * @implements {UnaryResponse<REQUEST, RESPONSE>}
 * @final
 * @package
 */
class UnaryResponseInternal {
  /**
   * @param {RESPONSE} responseMessage
   * @param {!MethodDescriptor<REQUEST, RESPONSE>} methodDescriptor
   * @param {!Metadata=} metadata
   * @param {?Status=} status
   */
  constructor(responseMessage, methodDescriptor, metadata = {}, status = null) {
    /**
     * @const {RESPONSE}
     * @private
     */
    this.responseMessage_ = responseMessage;

    /**
     * @const {!Metadata}
     * @private
     */
    this.metadata_ = metadata;

    /**
     * @const {!MethodDescriptor<REQUEST, RESPONSE>}
     * @private
     */
    this.methodDescriptor_ = methodDescriptor;

    /**
     * @const {?Status}
     * @private
     */
    this.status_ = status;
  }

  /** @override */
  getResponseMessage() {
    return this.responseMessage_;
  }

  /** @override */
  getMetadata() {
    return this.metadata_;
  }

  /** @override */
  getMethodDescriptor() {
    return this.methodDescriptor_;
  }

  /** @override */
  getStatus() {
    return this.status_;
  }
}

exports = UnaryResponseInternal;
