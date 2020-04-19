/**
 * @fileoverview Export symbols needed by generated code in CommonJS style.
 *
 * Note that public methods called by generated code are exposed
 * using Closure Compiler's @export annotation
 */
goog.module('grpc.web.Exports');

const AbstractClientBase = goog.require('grpc.web.AbstractClientBase');
const GrpcWebClientBase = goog.require('grpc.web.GrpcWebClientBase');
const StatusCode = goog.require('grpc.web.StatusCode');
const MethodDescriptor = goog.require('grpc.web.MethodDescriptor');
const MethodType = goog.require('grpc.web.MethodType');

module['exports']['AbstractClientBase'] = {'MethodInfo': AbstractClientBase.MethodInfo};
module['exports']['GrpcWebClientBase'] = GrpcWebClientBase;
module['exports']['StatusCode'] = StatusCode;
module['exports']['MethodDescriptor'] = MethodDescriptor;
module['exports']['MethodType'] = MethodType;
