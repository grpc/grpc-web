/**
 * @fileoverview  A wrapper class that provides all the information that is
 * needed to make a gRPC-Web request.
 */
goog.module('grpc.web.Request');
goog.module.declareLegacyNamespace();

const CallOptions = goog.require('grpc.web.CallOptions');
const Metadata = goog.require('grpc.web.Metadata');
const MethodDescriptor = goog.requireType('grpc.web.MethodDescriptor');

/**
 * @interface
 * @template REQUEST, RESPONSE
 */
class Request {
  /** @return {REQUEST} */
  getRequestMessage() {}

  /** @return {!MethodDescriptor<REQUEST, RESPONSE>}*/
  getMethodDescriptor() {}

  /** @return {!Metadata} */
  getMetadata() {}

  /**
   * Client CallOptions. Note that CallOptions has not been implemented in
   * grpc.web.AbstractClientbase yet, but will be used in
   * grpc.web.GenericClient.
   * @return {!CallOptions|undefined}
   */
  getCallOptions() {}
}

exports = Request;
