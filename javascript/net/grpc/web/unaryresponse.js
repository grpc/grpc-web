/**
 * @fileoverview gRPC web client UnaryResponse returned by grpc unary calls.
 * Response meassage and metadata are included in UnaryResponse.
 */

goog.module('grpc.web.UnaryResponse');
goog.module.declareLegacyNamespace();

const Metadata = goog.require('grpc.web.Metadata');

/**
 * @template RESPONSE
 */
class UnaryResponse {
  /**
   * @param {RESPONSE} responseMessage
   * @param {!Metadata=} metadata
   */
  constructor(responseMessage, metadata = {}) {
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
  }

  /** @return {RESPONSE} */
  getResponseMessage() {
    return this.responseMessage_;
  }

  /** @return {!Metadata} */
  getMetadata() {
    return this.metadata_;
  }
}

exports = UnaryResponse;
