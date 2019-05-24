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

const exports = module['exports'];

exports['AbstractClientBase'] = {'MethodInfo': AbstractClientBase.MethodInfo};
exports['GrpcWebClientBase'] = GrpcWebClientBase;
exports['StatusCode'] = StatusCode;
exports['MethodDescriptor'] = MethodDescriptor;
