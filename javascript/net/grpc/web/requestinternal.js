/**
 * @fileoverview Internal implementation of grpc.web.Request.
 */
goog.module('grpc.web.RequestInternal');
goog.module.declareLegacyNamespace();

const CallOptions = goog.require('grpc.web.CallOptions');
const Metadata = goog.require('grpc.web.Metadata');
const MethodDescriptor = goog.requireType('grpc.web.MethodDescriptor');
const Request = goog.require('grpc.web.Request');

/**
 * @template REQUEST, RESPONSE
 * @implements {Request<REQUEST, RESPONSE>}
 * @final
 * @package
 */
class RequestInternal {
  /**
   * @param {REQUEST} requestMessage
   * @param {!MethodDescriptor<REQUEST, RESPONSE>} methodDescriptor
   * @param {!Metadata} metadata
   * @param {!CallOptions} callOptions
   */
  constructor(requestMessage, methodDescriptor, metadata, callOptions) {
    /**
     * @const {REQUEST}
     * @private
     */
    this.requestMessage_ = requestMessage;

    /**
     * @const {!MethodDescriptor<REQUEST, RESPONSE>}
     * @private
     */
    this.methodDescriptor_ = methodDescriptor;

    /** @const @private */
    this.metadata_ = metadata;

    /** @const @private */
    this.callOptions_ = callOptions;
  }

  /**
   * @override
   * @return {REQUEST}
   */
  getRequestMessage() {
    return this.requestMessage_;
  }

  /**
   * @override
   * @return {!MethodDescriptor<REQUEST, RESPONSE>}
   */
  getMethodDescriptor() {
    return this.methodDescriptor_;
  }

  /**
   * @override
   * @return {!Metadata}
   */
  getMetadata() {
    return this.metadata_;
  }

  /**
   * @override
   * @return {!CallOptions|undefined}
   */
  getCallOptions() {
    return this.callOptions_;
  }

  /**
   * @override
   */
  withMetadata(key, value) {
    this.metadata_[key] = value;
    return this;
  }

  /**
   * @override
   */
  withGrpcCallOption(name, value) {
    this.callOptions_.setOption(name, value);
    return this;
  }
}

exports = RequestInternal;
