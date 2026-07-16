import 'jasmine';
import {StatusCode, fromHttpStatus, getHttpStatus} from './statuscode';

/**
 * Note that HTTP <-> gRPC status code conversions are lossy by nature, as
 * the mapping is not 1:1. The first status code in the array is what we expect
 * when translating HTTP -> gRPC status codes.
 */
const statusMap = new Map<number, StatusCode[]>([
  [200, [StatusCode.OK]],
  [400, [StatusCode.INVALID_ARGUMENT, StatusCode.OUT_OF_RANGE]],
  [401, [StatusCode.UNAUTHENTICATED]],
  [403, [StatusCode.PERMISSION_DENIED]],
  [404, [StatusCode.NOT_FOUND]],
  [409, [StatusCode.ABORTED, StatusCode.ALREADY_EXISTS]],
  [412, [StatusCode.FAILED_PRECONDITION]],
  [429, [StatusCode.RESOURCE_EXHAUSTED]],
  [500, [StatusCode.UNKNOWN, StatusCode.DATA_LOSS, StatusCode.INTERNAL]],
  [501, [StatusCode.UNIMPLEMENTED]],
  [503, [StatusCode.UNAVAILABLE]],
  [504, [StatusCode.DEADLINE_EXCEEDED]],
]);

describe('StatusCode', () => {
  it('should convert from HTTP status to gRPC status code', () => {
    statusMap.forEach((statusCodes, httpStatus) => {
      expect(fromHttpStatus(httpStatus)).toEqual(statusCodes[0]);
    });
  });

  it('should convert from gRPC status code to HTTP status', () => {
    statusMap.forEach((statusCodes, httpStatus) => {
      statusCodes.forEach((statusCode) => {
        expect(getHttpStatus(statusCode)).toEqual(httpStatus);
      });
    });
  });

  it('all status codes should have an HTTP status mapping', () => {
    expect(
      Object.values(StatusCode)
        .filter((code): code is StatusCode => typeof code === 'number')
        .every((code) => getHttpStatus(code) !== 0),
    ).toBe(true);
  });

  it('should handle UNKNOWN status codes', () => {
    expect(getHttpStatus(StatusCode.UNKNOWN)).toEqual(500);
    expect(fromHttpStatus(511)).toEqual(StatusCode.UNKNOWN);
  });
});
