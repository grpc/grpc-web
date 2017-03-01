#include "net/grpc/gateway/codec/grpc_web_decoder.h"

#include "net/grpc/gateway/log.h"
#include "net/grpc/gateway/utils.h"

namespace grpc {
namespace gateway {

const uint8_t GrpcWebDecoder::kGrpcWebMessage = 0;

GrpcWebDecoder::GrpcWebDecoder()
    : state_(kExpectingFlags), message_length_(0) {}
GrpcWebDecoder::~GrpcWebDecoder() {}

Status GrpcWebDecoder::Decode() {
  for (const Slice& slice : *inputs()) {
    if (slice.size() == 0) {
      continue;
    }

    for (size_t i = 0; i < slice.size(); i++) {
      uint8_t c = *(slice.begin() + i);
      switch (state_) {
        case kExpectingFlags: {
          if (c != kGrpcWebMessage) {
            // TODO(fengli): The following code is repeated 12 times. Extract it
            // into a function or a macro.
            Status status(StatusCode::INVALID_ARGUMENT,
                          Format("Receives invalid compressed flag: %X.", c));
            DEBUG("%s", status.error_message().c_str());
            return status;
          }
          state_ = kExpectingMessageLengthByte0;
          continue;
        }
        case kExpectingMessageLengthByte0: {
          message_length_ = c << 24;
          state_ = kExpectingMessageLengthByte1;
          continue;
        }
        case kExpectingMessageLengthByte1: {
          message_length_ += c << 16;
          state_ = kExpectingMessageLengthByte2;
          continue;
        }
        case kExpectingMessageLengthByte2: {
          message_length_ += c << 8;
          state_ = kExpectingMessageLengthByte3;
          continue;
        }
        case kExpectingMessageLengthByte3: {
          message_length_ += c;
          if (message_length_ == 0) {
            buffer_.reset(new Slice(grpc_empty_slice(), Slice::STEAL_REF));
            results()->push_back(
                std::unique_ptr<ByteBuffer>(new ByteBuffer(buffer_.get(), 1)));
            state_ = kExpectingFlags;
          } else {
            buffer_.reset(new Slice(grpc_slice_malloc(message_length_),
                                    Slice::STEAL_REF));
            state_ = kExpectingMessageData;
          }
          continue;
        }
        case kExpectingMessageData: {
          uint8_t* end = const_cast<uint8_t*>(buffer_->end());
          *(end - message_length_) = c;
          message_length_--;
          if (message_length_ == 0) {
            results()->push_back(
                std::unique_ptr<ByteBuffer>(new ByteBuffer(buffer_.get(), 1)));
            buffer_.reset();
            state_ = kExpectingFlags;
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
