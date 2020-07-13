/**
 * @fileoverview  A wrapper class that provides all the information that is
 * needed to make a gRPC-Web request.
 */
goog.module('grpc.web.Request');
goog.module.declareLegacyNamespace();

const CallOptions = goog.require('grpc.web.CallOptions');
const Metadata = goog.require('grpc.web.Metadata');
const MethodDescriptorInterface = goog.requireType('grpc.web.MethodDescriptorInterface');

/**
 * @interface
 * @template REQUEST, RESPONSE
 */
class Request {
  /**
   * @export
   * @return {REQUEST}
   */
  getRequestMessage() {}

  /**
   * @export
   * @return {!MethodDescriptorInterface<REQUEST, RESPONSE>}
   */
  getMethodDescriptor() {}

  /**
   * @export
   * @return {!Metadata}
   */
  getMetadata() {}

  /**
   * Client CallOptions. Note that CallOptions has not been implemented in
   * grpc.web.AbstractClientbase yet, but will be used in
   * grpc.web.GenericClient.
   * @export
   * @return {!CallOptions|undefined}
   */
  getCallOptions() {}
}

exports = Request;
