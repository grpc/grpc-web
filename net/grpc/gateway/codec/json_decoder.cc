#include "net/grpc/gateway/codec/json_decoder.h"

#include <cctype>
#include <cstdint>

#include "net/grpc/gateway/codec/base64.h"
#include "net/grpc/gateway/log.h"
#include "net/grpc/gateway/utils.h"

namespace grpc {
namespace gateway {
namespace {
static void do_nothing(void* ignored) {}
}

const char JSON_ARRAY_LEFT_BRACKET = '[';
const char JSON_ARRAY_RIGHT_BRACKET = ']';
const char JSON_OBJECT_LEFT_BRACKET = '{';
const char JSON_OBJECT_RIGHT_BRACKET = '}';
const char JSON_OBJECT_DELIMITER = ',';
const char JSON_DOUBLE_QUOTE = '"';
const char JSON_MESSAGE_TAG = '1';
const char JSON_STATUS_TAG = '2';
const char JSON_TAG_VALUE_DELIMITER = ':';

JsonDecoder::JsonDecoder() : state_(EXPECTING_JSON_ARRAY_LEFT_BRACKET) {}

JsonDecoder::~JsonDecoder() {}

Status JsonDecoder::Decode() {
  for (Slice& slice : *inputs()) {
    int start = -1;
    for (int i = 0; i < slice.size(); i++) {
      char c = *(slice.begin() + i);
      if (isblank(c)) {
        // Ignore blank characters.
        continue;
      }

      switch (state_) {
        case EXPECTING_JSON_ARRAY_LEFT_BRACKET: {
          if (c != JSON_ARRAY_LEFT_BRACKET) {
            Status status(
                StatusCode::INVALID_ARGUMENT,
                Format("Receives invalid character: %c when expecting "
                       "left bracket of the JSON array.",
                       c));
            DEBUG(status.error_message().c_str());
            return status;
          }
          state_ = EXPECTING_JSON_OBJECT_LEFT_BRACKET;
          continue;
        }
        case EXPECTING_JSON_OBJECT_LEFT_BRACKET: {
          if (c != JSON_OBJECT_LEFT_BRACKET) {
            Status status(
                StatusCode::INVALID_ARGUMENT,
                Format("Receives invalid character: %c when expecting "
                       "left bracket of the JSON object.",
                       c));
            DEBUG(status.error_message().c_str());
            return status;
          }
          state_ = EXPECTING_JSON_MESSAGE_TAG_LEFT_QUOTE;
          continue;
        }
        case EXPECTING_JSON_MESSAGE_TAG_LEFT_QUOTE: {
          if (c != JSON_DOUBLE_QUOTE) {
            Status status(
                StatusCode::INVALID_ARGUMENT,
                Format("Receives invalid character: %c when expecting "
                       "left double quote of the JSON message tag.",
                       c));
            DEBUG(status.error_message().c_str());
            return status;
          }
          state_ = EXPECTING_JSON_MESSAGE_TAG;
          continue;
        }
        case EXPECTING_JSON_MESSAGE_TAG: {
          if (c != JSON_MESSAGE_TAG) {
            Status status(StatusCode::INVALID_ARGUMENT,
                          Format("Receives invalid character: %c when "
                                 "expecting the message tag.",
                                 c));
            DEBUG(status.error_message().c_str());
            return status;
          }
          state_ = EXPECTING_JSON_MESSAGE_TAG_RIGHT_QUOTE;
          continue;
        }
        case EXPECTING_JSON_MESSAGE_TAG_RIGHT_QUOTE: {
          if (c != JSON_DOUBLE_QUOTE) {
            Status status(
                StatusCode::INVALID_ARGUMENT,
                Format("Receives invalid character: %c when expecting "
                       "right double quote of the JSON message tag.",
                       c));
            DEBUG(status.error_message().c_str());
            return status;
          }
          state_ = EXPECTING_JSON_MESSAGE_TAG_VALUE_DELIMITER;
          continue;
        }
        case EXPECTING_JSON_MESSAGE_TAG_VALUE_DELIMITER: {
          if (c != JSON_TAG_VALUE_DELIMITER) {
            Status status(
                StatusCode::INVALID_ARGUMENT,
                Format("Receives invalid character: %c when expecting "
                       "colon after the JSON message tag.",
                       c));
            DEBUG(status.error_message().c_str());
            return status;
          }
          state_ = EXPECTING_JSON_MESSAGE_VALUE_LEFT_QUOTE;
          continue;
        }
        case EXPECTING_JSON_MESSAGE_VALUE_LEFT_QUOTE: {
          if (c != JSON_DOUBLE_QUOTE) {
            Status status(
                StatusCode::INVALID_ARGUMENT,
                Format("Receives invalid character: %c when expecting "
                       "double quote of the JSON message value.",
                       c));
            DEBUG(status.error_message().c_str());
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
            if (start == i) {
              base64_buffer_.push_back(
                  Slice(gpr_empty_slice(), Slice::ADD_REF));
            } else {
              Slice s(
                  gpr_slice_new(reinterpret_cast<void*>(const_cast<uint8_t*>(
                                    slice.begin() + start)),
                                i - start, do_nothing),
                  Slice::ADD_REF);
              base64_buffer_.push_back(s);
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
          if (!IsBase64Char(c)) {
            Status status(
                StatusCode::INVALID_ARGUMENT,
                Format("Receives invalid character: %c when expecting "
                       "base64 characters for the JSON message value.",
                       c));
            DEBUG(status.error_message().c_str());
            return status;
          }
          if (start == -1) {
            start = i;
          }
          continue;
        }
        case EXPECTING_JSON_OBJECT_RIGHT_BRACKET: {
          if (c != JSON_OBJECT_RIGHT_BRACKET) {
            Status status(
                StatusCode::INVALID_ARGUMENT,
                Format("Receives invalid character: %c when expecting "
                       "right bracket of the JSON object.",
                       c));
            DEBUG(status.error_message().c_str());
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
          Status status(StatusCode::INVALID_ARGUMENT,
                        Format("Receives invalid character: %c when expecting "
                               "right bracket of the JSON array.",
                               c));
          DEBUG(status.error_message().c_str());
          return status;
        }
        case FINISH: {
          Status status(StatusCode::INVALID_ARGUMENT,
                        Format("Receives invalid character: %c when "
                               "the JSON array already completed.",
                               c));
          DEBUG(status.error_message().c_str());
          return status;
        }
      }
    }

    if (start >= 0) {
      Slice s(gpr_slice_new(reinterpret_cast<void*>(
                                const_cast<uint8_t*>(slice.begin() + start)),
                            slice.size() - start, do_nothing),
              Slice::ADD_REF);
      base64_buffer_.push_back(s);
    }
  }
  return Status::OK;
}
}  // namespace gateway
}  // namespace grpc
