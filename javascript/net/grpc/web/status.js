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
goog.module('grpc.web.Status');
goog.module.declareLegacyNamespace();


/** @record */
function Status() {}

/** @export {number} */
Status.prototype.code;

/** @export {string} */
Status.prototype.details;

/** @export {(!Object<string, string>|undefined)} */
Status.prototype.metadata;

exports.Status = Status;
