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

goog.module('grpc.web.DefaultClientReadableStreamDelegate');

goog.module.declareLegacyNamespace();

const ClientReadableStreamDelegate = goog.require('grpc.web.ClientReadableStreamDelegate');
const {Status} = goog.require('grpc.web.Status');



/**
 * @template RESPONSE
 * @implements {ClientReadableStreamDelegate<RESPONSE>}
 */
class DefaultClientReadableStreamDelegate {
  /**
   * Creates a new Default Delegate.
   */
  constructor() {
    /**
     * @private {?function(!RESPONSE): void}
     */
    this.onDataCallback_ = null;

    /**
     * @private {?function(...): ?}
     */
    this.onErrorCallback_ = null;

    /**
     * @private {?function(): void}
     */
    this.onEndCallback_ = null;

    /**
     * @private {?function(!Status): void}
     */
    this.onStatusCallback_ = null;
  }

  /**
   * @override
   */
  onData(data) {
    if (!goog.isNull(this.onDataCallback_)) {
      this.onDataCallback_(data);
    }
  }

  /**
   * @param {!function(!RESPONSE): void} callback
   * @return {void}
   */
  setOnData(callback) {
    this.onDataCallback_ = callback;
  }

  /**
   * @override
   */
  onEnd() {
    if (!goog.isNull(this.onEndCallback_)) {
      this.onEndCallback_();
    }
  }

  /**
   * @param {!function(): void} callback
   * @return {void}
   */
  setOnEnd(callback) {
    this.onEndCallback_ = callback;
  }

  /**
   * @override
   */
  onError(error) {
    if (!goog.isNull(this.onErrorCallback_)) {
      this.onErrorCallback_(error);
    }
  }

  /**
   * @param {!function(...): ?} callback
   * @return {void}
   */
  setOnError(callback) {
    this.onErrorCallback_ = callback;
  }

  /**
   * @override
   */
  onStatus(status) {
    if (!goog.isNull(this.onStatusCallback_)) {
      this.onStatusCallback_(status);
    }
  }

  /**
   * @param {!function(!Status): void} callback
   * @return {void}
   */
  setOnStatus(callback) {
    this.onStatusCallback_ = callback;
  }
}
exports = DefaultClientReadableStreamDelegate;
