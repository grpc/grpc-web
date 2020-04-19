/**
 * @fileoverview gRPC web client UnaryResponse returned by grpc unary calls.
 * Response meassage and metadata are included in UnaryResponse.
 */

goog.module('grpc.web.UnaryResponse');
goog.module.declareLegacyNamespace();

const Metadata = goog.require('grpc.web.Metadata');
const {Status} = goog.require('grpc.web.Status');

/**
 * @template RESPONSE
 */
class UnaryResponse {
  /**
   * @param {RESPONSE} responseMessage
   * @param {!Metadata=} metadata
   * @param {?Status=} status
   */
  constructor(responseMessage, metadata, status) {
    /**
     * @const {RESPONSE}
     * @private
     */
    this.responseMessage_ = responseMessage;

    /**
     * @const {!Metadata}
     * @private
     */
    this.metadata_ = metadata || {};

    /**
     * @const {?Status}
     * @private
     */
    this.status_ = status ? status : null;
  }

  /** @return {RESPONSE} */
  getResponseMessage() {
    return this.responseMessage_;
  }

  /** @return {!Metadata} */
  getMetadata() {
    return this.metadata_;
  }

  /**
   * gRPC status. Trailer metadata returned from a gRPC server is in
   * status.metadata.
   * @return {?Status}
   */
  getStatus() {
    return this.status_;
  }
}

exports = UnaryResponse;
