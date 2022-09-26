/**
 *
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
/**
 * @fileoverview gRPC Web Status codes and mapping.
 *
 * gRPC Web Status codes and mapping.
 *
 * @author stanleycheung@google.com (Stanley Cheung)
 */
goog.module('grpc.web.StatusCode');

/**
 * gRPC Status Codes
 * See:
 * https://github.com/grpc/grpc/blob/master/include/grpcpp/impl/codegen/status_code_enum.h
 * @enum {number}
 */
const StatusCode = {
  // LINT.IfChange(status_codes)

  // Not an error; returned on success.
  'OK': 0,

  // The operation was cancelled (typically by the caller).
  'CANCELLED': 1,

  // Unknown error. An example of where this error may be returned is if a
  // Status value received from another address space belongs to an error-space
  // that is not known in this address space. Also errors raised by APIs that
  // do not return enough error information may be converted to this error.
  'UNKNOWN': 2,

  // Client specified an invalid argument. Note that this differs from
  // FAILED_PRECONDITION. INVALID_ARGUMENT indicates arguments that are
  // problematic regardless of the state of the system (e.g., a malformed file
  // name).
  'INVALID_ARGUMENT': 3,

  // Deadline expired before operation could complete. For operations that
  // change the state of the system, this error may be returned even if the
  // operation has completed successfully. For example, a successful response
  // from a server could have been delayed long enough for the deadline to
  // expire.
  'DEADLINE_EXCEEDED': 4,

  // Some requested entity (e.g., file or directory) was not found.
  'NOT_FOUND': 5,

  // Some entity that we attempted to create (e.g., file or directory) already
  // exists.
  'ALREADY_EXISTS': 6,

  // The caller does not have permission to execute the specified operation.
  // PERMISSION_DENIED must not be used for rejections caused by exhausting
  // some resource (use RESOURCE_EXHAUSTED instead for those errors).
  // PERMISSION_DENIED must not be used if the caller can not be identified
  // (use UNAUTHENTICATED instead for those errors).
  'PERMISSION_DENIED': 7,

  // The request does not have valid authentication credentials for the
  // operation.
  'UNAUTHENTICATED': 16,

  // Some resource has been exhausted, perhaps a per-user quota, or perhaps the
  // entire file system is out of space.
  'RESOURCE_EXHAUSTED': 8,

  // Operation was rejected because the system is not in a state required for
  // the operation's execution. For example, directory to be deleted may be
  // non-empty, an rmdir operation is applied to a non-directory, etc.
  //
  // A litmus test that may help a service implementor in deciding
  // between FAILED_PRECONDITION, ABORTED, and UNAVAILABLE:
  //  (a) Use UNAVAILABLE if the client can retry just the failing call.
  //  (b) Use ABORTED if the client should retry at a higher-level
  //      (e.g., restarting a read-modify-write sequence).
  //  (c) Use FAILED_PRECONDITION if the client should not retry until
  //      the system state has been explicitly fixed. E.g., if an "rmdir"
  //      fails because the directory is non-empty, FAILED_PRECONDITION
  //      should be returned since the client should not retry unless
  //      they have first fixed up the directory by deleting files from it.
  //  (d) Use FAILED_PRECONDITION if the client performs conditional
  //      REST Get/Update/Delete on a resource and the resource on the
  //      server does not match the condition. E.g., conflicting
  //      read-modify-write on the same resource.
  'FAILED_PRECONDITION': 9,

  // The operation was aborted, typically due to a concurrency issue like
  // sequencer check failures, transaction aborts, etc.
  //
  // See litmus test above for deciding between FAILED_PRECONDITION, ABORTED,
  // and UNAVAILABLE.
  'ABORTED': 10,

  // Operation was attempted past the valid range. E.g., seeking or reading
  // past end of file.
  //
  // Unlike INVALID_ARGUMENT, this error indicates a problem that may be fixed
  // if the system state changes. For example, a 32-bit file system will
  // generate INVALID_ARGUMENT if asked to read at an offset that is not in the
  // range [0,2^32-1], but it will generate OUT_OF_RANGE if asked to read from
  // an offset past the current file size.
  //
  // There is a fair bit of overlap between FAILED_PRECONDITION and
  // OUT_OF_RANGE. We recommend using OUT_OF_RANGE (the more specific error)
  // when it applies so that callers who are iterating through a space can
  // easily look for an OUT_OF_RANGE error to detect when they are done.
  'OUT_OF_RANGE': 11,

  // Operation is not implemented or not supported/enabled in this service.
  'UNIMPLEMENTED': 12,

  // Internal errors. Means some invariants expected by underlying System has
  // been broken. If you see one of these errors, Something is very broken.
  'INTERNAL': 13,

  // The service is currently unavailable. This is a most likely a transient
  // condition and may be corrected by retrying with a backoff.
  //
  // See litmus test above for deciding between FAILED_PRECONDITION, ABORTED,
  // and UNAVAILABLE.
  'UNAVAILABLE': 14,

  // Unrecoverable data loss or corruption.
  'DATA_LOSS': 15,

  // LINT.ThenChange(:status_code_name)
};

/**
 * Convert HTTP Status code to gRPC Status code
 * @param {number} httpStatus HTTP Status Code
 * @return {!StatusCode} gRPC Status Code
 */
StatusCode.fromHttpStatus = function(httpStatus) {
  switch (httpStatus) {
    case 200:
      return StatusCode.OK;
    case 400:
      return StatusCode.INVALID_ARGUMENT;
    case 401:
      return StatusCode.UNAUTHENTICATED;
    case 403:
      return StatusCode.PERMISSION_DENIED;
    case 404:
      return StatusCode.NOT_FOUND;
    case 409:
      return StatusCode.ABORTED;
    case 412:
      return StatusCode.FAILED_PRECONDITION;
    case 429:
      return StatusCode.RESOURCE_EXHAUSTED;
    case 499:
      return StatusCode.CANCELLED;
    case 500:
      return StatusCode.UNKNOWN;
    case 501:
      return StatusCode.UNIMPLEMENTED;
    case 503:
      return StatusCode.UNAVAILABLE;
    case 504:
      return StatusCode.DEADLINE_EXCEEDED;
    /* everything else is unknown */
    default:
      return StatusCode.UNKNOWN;
  }
};


/**
 * Convert a {@link StatusCode} to an HTTP Status code
 * @param {!StatusCode} statusCode GRPC Status Code
 * @return {number} HTTP Status code
 */
StatusCode.getHttpStatus = function(statusCode) {
  switch (statusCode) {
    case StatusCode.OK:
      return 200;
    case StatusCode.INVALID_ARGUMENT:
      return 400;
    case StatusCode.UNAUTHENTICATED:
      return 401;
    case StatusCode.PERMISSION_DENIED:
      return 403;
    case StatusCode.NOT_FOUND:
      return 404;
    case StatusCode.ABORTED:
      return 409;
    case StatusCode.FAILED_PRECONDITION:
      return 412;
    case StatusCode.RESOURCE_EXHAUSTED:
      return 429;
    case StatusCode.CANCELLED:
      return 499;
    case StatusCode.UNKNOWN:
      return 500;
    case StatusCode.UNIMPLEMENTED:
      return 501;
    case StatusCode.UNAVAILABLE:
      return 503;
    case StatusCode.DEADLINE_EXCEEDED:
      return 504;
    /* everything else is unknown */
    default:
      return 0;
  }
};

/**
 * Returns the human readable name for a {@link StatusCode}. Useful for logging.
 * @param {!StatusCode} statusCode GRPC Status Code
 * @return {string} the human readable name for the status code
 */
StatusCode.statusCodeName = function(statusCode) {
  switch (statusCode) {
      // LINT.IfChange(status_code_name)
    case StatusCode.OK:
      return 'OK';
    case StatusCode.CANCELLED:
      return 'CANCELLED';
    case StatusCode.UNKNOWN:
      return 'UNKNOWN';
    case StatusCode.INVALID_ARGUMENT:
      return 'INVALID_ARGUMENT';
    case StatusCode.DEADLINE_EXCEEDED:
      return 'DEADLINE_EXCEEDED';
    case StatusCode.NOT_FOUND:
      return 'NOT_FOUND';
    case StatusCode.ALREADY_EXISTS:
      return 'ALREADY_EXISTS';
    case StatusCode.PERMISSION_DENIED:
      return 'PERMISSION_DENIED';
    case StatusCode.UNAUTHENTICATED:
      return 'UNAUTHENTICATED';
    case StatusCode.RESOURCE_EXHAUSTED:
      return 'RESOURCE_EXHAUSTED';
    case StatusCode.FAILED_PRECONDITION:
      return 'FAILED_PRECONDITION';
    case StatusCode.ABORTED:
      return 'ABORTED';
    case StatusCode.OUT_OF_RANGE:
      return 'OUT_OF_RANGE';
    case StatusCode.UNIMPLEMENTED:
      return 'UNIMPLEMENTED';
    case StatusCode.INTERNAL:
      return 'INTERNAL';
    case StatusCode.UNAVAILABLE:
      return 'UNAVAILABLE';
    case StatusCode.DATA_LOSS:
      return 'DATA_LOSS';
    default:
      return '';
    // LINT.ThenChange(:status_codes)
  }
};

exports = StatusCode;
