/**
 * @fileoverview Description of this file.
 *
 * A templated class that is used to address gRPC Web requests.
 */

goog.module('grpc.web.MethodDescriptor');
goog.module.declareLegacyNamespace();

const CallOptions = goog.require('grpc.web.CallOptions');
const Metadata = goog.requireType('grpc.web.Metadata');
const MethodDescriptorInterface = goog.requireType('grpc.web.MethodDescriptorInterface');
const MethodType = goog.requireType('grpc.web.MethodType');
const Request = goog.requireType('grpc.web.Request');
const RequestInternal = goog.require('grpc.web.RequestInternal');
const UnaryResponse = goog.requireType('grpc.web.UnaryResponse');
const UnaryResponseInternal = goog.require('grpc.web.UnaryResponseInternal');
const {Status} = goog.requireType('grpc.web.Status');

/**
 * @final
 * @implements {MethodDescriptorInterface<REQUEST, RESPONSE>}
 * @template REQUEST, RESPONSE
 * @unrestricted
 */
const MethodDescriptor = class {
  /**
   * @param {string} name
   * @param {?MethodType} methodType
   * @param {function(new: REQUEST, ...)} requestType
   * @param {function(new: RESPONSE, ...)} responseType
   * @param {function(REQUEST): ?} requestSerializeFn
   * @param {function(?): RESPONSE} responseDeserializeFn
   */
  constructor(
      name, methodType, requestType, responseType, requestSerializeFn,
      responseDeserializeFn) {
    /** @const */
    this.name = name;
    /** @const */
    this.methodType = methodType;
    /** @const */
    this.requestType = requestType;
    /** @const */
    this.responseType = responseType;
    /** @const */
    this.requestSerializeFn = requestSerializeFn;
    /** @const */
    this.responseDeserializeFn = responseDeserializeFn;
  }

  /**
   * @override
   * @param {REQUEST} requestMessage
   * @param {!Metadata=} metadata
   * @param {!CallOptions=} callOptions
   * @return {!Request<REQUEST, RESPONSE>}
   */
  createRequest(
      requestMessage, metadata = {}, callOptions = new CallOptions()) {
    return new RequestInternal(requestMessage, this, metadata, callOptions);
  }

  /**
   * @override
   * @param {RESPONSE} responseMessage
   * @param {!Metadata=} metadata
   * @param {?Status=} status
   * @return {!UnaryResponse<REQUEST, RESPONSE>}
   */
  createUnaryResponse(responseMessage, metadata = {}, status = null) {
    return new UnaryResponseInternal(responseMessage, this, metadata, status);
  }

  /**
   * @override
   * @export
   */
  getName() {
    return this.name;
  }

  /**
   * @override
   */
  getMethodType() {
    return this.methodType;
  }

  /**
   * @override
   * @return {function(new: RESPONSE, ...)}
   */
  getResponseMessageCtor() {
    return this.responseType;
  }

  /**
   * @override
   * @return {function(new: REQUEST, ...)}
   */
  getRequestMessageCtor() {
    return this.requestType;
  }

  /** @override */
  getResponseDeserializeFn() {
    return this.responseDeserializeFn;
  }

  /** @override */
  getRequestSerializeFn() {
    return this.requestSerializeFn;
  }
};



exports = MethodDescriptor;
