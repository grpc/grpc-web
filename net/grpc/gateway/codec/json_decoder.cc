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

#include "net/grpc/gateway/codec/json_decoder.h"

#include <cctype>
#include <cstdint>

#include "net/grpc/gateway/codec/base64.h"
#include "net/grpc/gateway/log.h"
#include "net/grpc/gateway/utils.h"

namespace grpc {
namespace gateway {

const char JSON_ARRAY_LEFT_BRACKET = '[';
const char JSON_ARRAY_RIGHT_BRACKET = ']';
const char JSON_OBJECT_LEFT_BRACKET = '{';
const char JSON_OBJECT_RIGHT_BRACKET = '}';
const char JSON_OBJECT_DELIMITER = ',';
const char JSON_DOUBLE_QUOTE = '"';
const char JSON_MESSAGE_TAG = '1';
const char JSON_TAG_VALUE_DELIMITER = ':';

JsonDecoder::JsonDecoder() : state_(EXPECTING_JSON_ARRAY_LEFT_BRACKET) {}

JsonDecoder::~JsonDecoder() {}

Status JsonDecoder::Decode() {
  for (Slice& slice : *inputs()) {
    int start = -1;
    for (size_t i = 0; i < slice.size(); i++) {
      char c = *(slice.begin() + i);
      if (isblank(c)) {
        // Ignore blank characters.
        continue;
      }

      switch (state_) {
        case EXPECTING_JSON_ARRAY_LEFT_BRACKET: {
          if (c != JSON_ARRAY_LEFT_BRACKET) {
            // TODO(fengli): The following code is repeated 12 times. Extract it
            // into a function or a macro.
            Status status(
                StatusCode::INVALID_ARGUMENT,
                Format("Receives invalid character: %c when expecting "
                       "left bracket of the JSON array.",
                       c));
            DEBUG("%s", status.error_message().c_str());
            return status;
          }
          state_ = EXPECTING_JSON_OBJECT_LEFT_BRACKET;
          continue;
        }
        case EXPECTING_JSON_OBJECT_LEFT_BRACKET: {
          if (c != JSON_OBJECT_LEFT_BRACKET) {
            // TODO(fengli): The following code is repeated 12 times. Extract it
            // into a function or a macro.
            Status status(
                StatusCode::INVALID_ARGUMENT,
                Format("Receives invalid character: %c when expecting "
                       "left bracket of the JSON object.",
                       c));
            DEBUG("%s", status.error_message().c_str());
            return status;
          }
          state_ = EXPECTING_JSON_MESSAGE_TAG_LEFT_QUOTE;
          continue;
        }
        case EXPECTING_JSON_MESSAGE_TAG_LEFT_QUOTE: {
          if (c != JSON_DOUBLE_QUOTE) {
            // TODO(fengli): The following code is repeated 12 times. Extract it
            // into a function or a macro.
            Status status(
                StatusCode::INVALID_ARGUMENT,
                Format("Receives invalid character: %c when expecting "
                       "left double quote of the JSON message tag.",
                       c));
            DEBUG("%s", status.error_message().c_str());
            return status;
          }
          state_ = EXPECTING_JSON_MESSAGE_TAG;
          continue;
        }
        case EXPECTING_JSON_MESSAGE_TAG: {
          if (c != JSON_MESSAGE_TAG) {
            // TODO(fengli): The following code is repeated 12 times. Extract it
            // into a function or a macro.
            Status status(StatusCode::INVALID_ARGUMENT,
                          Format("Receives invalid character: %c when "
                                 "expecting the message tag.",
                                 c));
            DEBUG("%s", status.error_message().c_str());
            return status;
          }
          state_ = EXPECTING_JSON_MESSAGE_TAG_RIGHT_QUOTE;
          continue;
        }
        case EXPECTING_JSON_MESSAGE_TAG_RIGHT_QUOTE: {
          if (c != JSON_DOUBLE_QUOTE) {
            // TODO(fengli): The following code is repeated 12 times. Extract it
            // into a function or a macro.
            Status status(
                StatusCode::INVALID_ARGUMENT,
                Format("Receives invalid character: %c when expecting "
                       "right double quote of the JSON message tag.",
                       c));
            DEBUG("%s", status.error_message().c_str());
            return status;
          }
          state_ = EXPECTING_JSON_MESSAGE_TAG_VALUE_DELIMITER;
          continue;
        }
        case EXPECTING_JSON_MESSAGE_TAG_VALUE_DELIMITER: {
          if (c != JSON_TAG_VALUE_DELIMITER) {
            // TODO(fengli): The following code is repeated 12 times. Extract it
            // into a function or a macro.
            Status status(
                StatusCode::INVALID_ARGUMENT,
                Format("Receives invalid character: %c when expecting "
                       "colon after the JSON message tag.",
                       c));
            DEBUG("%s", status.error_message().c_str());
            return status;
          }
          state_ = EXPECTING_JSON_MESSAGE_VALUE_LEFT_QUOTE;
          continue;
        }
        case EXPECTING_JSON_MESSAGE_VALUE_LEFT_QUOTE: {
          if (c != JSON_DOUBLE_QUOTE) {
            // TODO(fengli): The following code is repeated 12 times. Extract it
            // into a function or a macro.
            Status status(
                StatusCode::INVALID_ARGUMENT,
                Format("Receives invalid character: %c when expecting "
                       "double quote of the JSON message value.",
                       c));
            DEBUG("%s", status.error_message().c_str());
            return status;
          }
          start = i + 1;
          state_ = EXPECTING_JSON_MESSAGE_VALUE_OR_RIGHT_QUOTE;
          continue;
        }
        case EXPECTING_JSON_MESSAGE_VALUE_OR_RIGHT_QUOTE: {
          if (c == JSON_DOUBLE_QUOTE) {
            if (start == -1) {
              start = 0;
            }
            if (static_cast<size_t>(start) == i) {
              base64_buffer_.push_back(
                  Slice(grpc_empty_slice(), Slice::STEAL_REF));
            } else {
              base64_buffer_.push_back(Slice(
                  grpc_slice_from_copied_buffer(
                      reinterpret_cast<const char*>(slice.begin() + start),
                      i - start),
                  Slice::STEAL_REF));
            }
            std::vector<Slice> decoded;
            base64_.Decode(base64_buffer_, &decoded);
            results()->push_back(std::unique_ptr<ByteBuffer>(
                new ByteBuffer(&decoded[0], decoded.size())));
            base64_buffer_.clear();
            start = -1;
            state_ = EXPECTING_JSON_OBJECT_RIGHT_BRACKET;
            continue;
          }
          if (!Base64::IsBase64Char(c)) {
            // TODO(fengli): The following code is repeated 12 times. Extract it
            // into a function or a macro.
            Status status(
                StatusCode::INVALID_ARGUMENT,
                Format("Receives invalid character: %c when expecting "
                       "base64 characters for the JSON message value.",
                       c));
            DEBUG("%s", status.error_message().c_str());
            return status;
          }
          if (start == -1) {
            start = i;
          }
          continue;
        }
        case EXPECTING_JSON_OBJECT_RIGHT_BRACKET: {
          if (c != JSON_OBJECT_RIGHT_BRACKET) {
            // TODO(fengli): The following code is repeated 12 times. Extract it
            // into a function or a macro.
            Status status(
                StatusCode::INVALID_ARGUMENT,
                Format("Receives invalid character: %c when expecting "
                       "right bracket of the JSON object.",
                       c));
            DEBUG("%s", status.error_message().c_str());
            return status;
          }
          state_ = EXPECTING_JSON_OBJECT_DELIMITER_OR_JSON_ARRAY_RIGHT_BRACKET;
          continue;
        }
        case EXPECTING_JSON_OBJECT_DELIMITER_OR_JSON_ARRAY_RIGHT_BRACKET: {
          if (c == JSON_OBJECT_DELIMITER) {
            state_ = EXPECTING_JSON_OBJECT_LEFT_BRACKET;
            continue;
          }
          if (c == JSON_ARRAY_RIGHT_BRACKET) {
            state_ = FINISH;
            continue;
          }
          // TODO(fengli): The following code is repeated 12 times. Extract it
          // into a function or a macro.
          Status status(StatusCode::INVALID_ARGUMENT,
                        Format("Receives invalid character: %c when expecting "
                               "right bracket of the JSON array.",
                               c));
          DEBUG("%s", status.error_message().c_str());
          return status;
        }
        case FINISH: {
          //  TODO(fengli): The following code is repeated 12 times. Extract it
          //  into a function or a macro.
          Status status(StatusCode::INVALID_ARGUMENT,
                        Format("Receives invalid character: %c when "
                               "the JSON array already completed.",
                               c));
          DEBUG("%s", status.error_message().c_str());
          return status;
        }
      }
    }

    if (start >= 0) {
      base64_buffer_.push_back(
          Slice(grpc_slice_from_copied_buffer(
                    reinterpret_cast<const char*>(slice.begin() + start),
                    slice.size() - start),
                Slice::STEAL_REF));
    }
  }
  inputs()->clear();
  return Status::OK;
}
}  // namespace gateway
}  // namespace grpc
