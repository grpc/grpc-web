const assert = require('assert');
const grpc = {};
grpc.web = require('grpc-web');

describe('grpc-web export test', function() {
  it('should have AbstractClientBase.MethodInfo exported', function() {
    assert.equal(typeof grpc.web.AbstractClientBase.MethodInfo, 'function');
  });

  it('should have MethodDescriptor exported', function() {
    assert.equal(typeof grpc.web.MethodDescriptor, 'function');
  });

  it('should have GrpcWebClientBase#rpcCall() exported', function() {
    assert.equal(typeof grpc.web.GrpcWebClientBase.prototype.rpcCall, 'function');
  });

  it('should have GrpcWebClientBase#serverStreaming() exported', function() {
    assert.equal(typeof grpc.web.GrpcWebClientBase.prototype.serverStreaming, 'function');
  });

  it('should have grpc StatusCode exported', function() {
    assert.deepEqual(grpc.web.StatusCode, {
      ABORTED: 10,
      ALREADY_EXISTS: 6,
      CANCELLED: 1,
      DATA_LOSS: 15,
      DEADLINE_EXCEEDED: 4,
      FAILED_PRECONDITION: 9,
      INTERNAL: 13,
      INVALID_ARGUMENT: 3,
      NOT_FOUND: 5,
      OK: 0,
      OUT_OF_RANGE: 11,
      PERMISSION_DENIED: 7,
      RESOURCE_EXHAUSTED: 8,
      UNAUTHENTICATED: 16,
      UNAVAILABLE: 14,
      UNIMPLEMENTED: 12,
      UNKNOWN: 2
    });
  });
});
