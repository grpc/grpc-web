goog.module('grpc.web.StatusCodeTest');
goog.setTestOnly('grpc.web.StatusCodeTest');

const StatusCode = goog.require('grpc.web.StatusCode');
const testSuite = goog.require('goog.testing.testSuite');


/** @type {!Map<number, !StatusCode>} */
const statusMap = new Map([
  [200, StatusCode.OK],
  [400, StatusCode.INVALID_ARGUMENT],
  [401, StatusCode.UNAUTHENTICATED],
  [403, StatusCode.PERMISSION_DENIED],
  [404, StatusCode.NOT_FOUND],
  [409, StatusCode.ABORTED],
  [412, StatusCode.FAILED_PRECONDITION],
  [429, StatusCode.RESOURCE_EXHAUSTED],
  [500, StatusCode.UNKNOWN],
  [501, StatusCode.UNIMPLEMENTED],
  [503, StatusCode.UNAVAILABLE],
  [504, StatusCode.DEADLINE_EXCEEDED],
]);

testSuite({
  testFromHttpStatus() {
    statusMap.forEach((statusCode, httpStatus) => {
      assertEquals(StatusCode.fromHttpStatus(httpStatus), statusCode);
    });
  },

  testGetHttpStatus() {
    statusMap.forEach((statusCode, httpStatus) => {
      assertEquals(StatusCode.getHttpStatus(statusCode), httpStatus);
    });
  },

  testUnknown() {
    assertEquals(StatusCode.getHttpStatus(StatusCode.UNKNOWN), 500);
    assertEquals(StatusCode.fromHttpStatus(511), StatusCode.UNKNOWN);
  }
});