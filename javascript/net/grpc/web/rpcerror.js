/**
 *
 * Copyright 2021 Google LLC
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
 * @fileoverview gRPC-Web Error objects
 *
 * gRPC-Web Error objects
 *
 * @suppress {lintChecks} gRPC-Web is still using default goog.module exports
 * right now, and the output of grpc_generator.cc uses goog.provide.
 */
goog.module('grpc.web.RpcError');

const Metadata = goog.require('grpc.web.Metadata');
const StatusCode = goog.require('grpc.web.StatusCode');

/**
 * gRPC-Web Error object, contains the {@link StatusCode}, a string message
 * and {@link Metadata} contained in the error response.
 */
class RpcError extends Error {
  /**
   * @param {!StatusCode} code
   * @param {string} message
   * @param {!Metadata=} metadata
   */
  constructor(code, message, metadata = {}) {
    super(message);
    /** @type {!StatusCode} */
    this.code = code;
    /** @type {!Metadata} */
    this.metadata = metadata;
  }
}

/** @override */
RpcError.prototype.name = 'RpcError';

exports = RpcError;
