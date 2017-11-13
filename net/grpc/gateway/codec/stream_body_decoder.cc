#include "net/grpc/gateway/codec/stream_body_decoder.h"

#include <cmath>
#include <cstdint>

#include "net/grpc/gateway/log.h"
#include "net/grpc/gateway/utils.h"
#include "third_party/grpc/include/grpc/slice.h"
#include "third_party/grpc/include/grpc/support/string_util.h"

namespace grpc {
namespace gateway {

// key: 00001, type: 010
const uint8_t MESSAGE_KEY_TYPE = 0x0A;

StreamBodyDecoder::StreamBodyDecoder()
    : state_(EXPECTING_MESSAGE_KEY_TYPE), varint_value_(0), varint_bytes_(0) {}

StreamBodyDecoder::~StreamBodyDecoder() {}

Status StreamBodyDecoder::Decode() {
  for (const Slice& slice : *inputs()) {
    if (slice.size() == 0) {
      continue;
    }

    for (size_t i = 0; i < slice.size(); i++) {
      uint8_t c = *(slice.begin() + i);
      switch (state_) {
        case EXPECTING_MESSAGE_KEY_TYPE: {
          if (c != MESSAGE_KEY_TYPE) {
            Status status(
                StatusCode::INVALID_ARGUMENT,
                Format("Receives invalid character: %c when expecting "
                       "key/type byte of the proto message.",
                       c));
            DEBUG("%s", status.error_message().c_str());
            return status;
          }
          state_ = EXPECTING_MESSAGE_VARINT_LENGTH;
          continue;
        }
        case EXPECTING_MESSAGE_VARINT_LENGTH: {
          varint_value_ += (c & 0x7F) * pow(0x80, varint_bytes_);
          varint_bytes_++;
          if ((c & 0x80) == 0) {
            varint_bytes_ = 0;
            if (varint_value_ == 0) {
              buffer_.reset(new Slice(grpc_empty_slice(), Slice::STEAL_REF));
              results()->push_back(std::unique_ptr<ByteBuffer>(
                  new ByteBuffer(buffer_.get(), 1)));
              state_ = EXPECTING_MESSAGE_KEY_TYPE;
            } else {
              grpc_slice slice = grpc_slice_malloc(varint_value_);
              buffer_.reset(new Slice(slice, Slice::STEAL_REF));
              state_ = EXPECTING_MESSAGE_DATA;
            }
          }
          continue;
        }
        case EXPECTING_MESSAGE_DATA: {
          uint8_t* end = const_cast<uint8_t*>(buffer_->end());
          *(end - varint_value_) = c;
          varint_value_--;
          if (varint_value_ == 0) {
            results()->push_back(
                std::unique_ptr<ByteBuffer>(new ByteBuffer(buffer_.get(), 1)));
            state_ = EXPECTING_MESSAGE_KEY_TYPE;
          }
          continue;
        }
      }
    }
  }
  inputs()->clear();
  return Status::OK;
}
}  // namespace gateway
}  // namespace grpc
