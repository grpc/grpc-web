#include "net/grpc/gateway/codec/grpc_decoder.h"

#include "net/grpc/gateway/log.h"
#include "net/grpc/gateway/utils.h"
extern "C" {
#include "third_party/grpc/src/core/lib/compression/message_compress.h"
}

namespace grpc {
namespace gateway {
GrpcDecoder::GrpcDecoder()
    : state_(kExpectingCompressedFlag),
      compression_algorithm_(kIdentity),
      compressed_flag_(0),
      message_length_(0) {}
GrpcDecoder::~GrpcDecoder() {}

Status GrpcDecoder::Decode() {
  for (const Slice& slice : *inputs()) {
    if (slice.size() == 0) {
      continue;
    }

    for (int i = 0; i < slice.size(); i++) {
      uint8_t c = *(slice.begin() + i);
      switch (state_) {
        case kExpectingCompressedFlag: {
          if (c != CompressedFlag::kUncompressed &&
              c != CompressedFlag::kCompressed) {
            Status status(StatusCode::INVALID_ARGUMENT,
                          Format("Receives invalid compressed flag: %c.", c));
            DEBUG(status.error_message().c_str());
            return status;
          }
          compressed_flag_ = c;
          state_ = kExpectingMessageLengthByte0;
          continue;
        }
        case kExpectingMessageLengthByte0: {
          message_length_ = c & 0xFF000000;
          state_ = kExpectingMessageLengthByte1;
          continue;
        }
        case kExpectingMessageLengthByte1: {
          message_length_ += c & 0x00FF0000;
          state_ = kExpectingMessageLengthByte2;
          continue;
        }
        case kExpectingMessageLengthByte2: {
          message_length_ += c & 0x0000FF00;
          state_ = kExpectingMessageLengthByte3;
          continue;
        }
        case kExpectingMessageLengthByte3: {
          message_length_ += c & 0x000000FF;
          if (message_length_ == 0) {
            buffer_.reset(new Slice(gpr_empty_slice(), Slice::STEAL_REF));
            results()->push_back(std::unique_ptr<ByteBuffer>(
                new ByteBuffer(buffer_.release(), 1)));
            state_ = kExpectingCompressedFlag;
          } else {
            gpr_slice slice = gpr_slice_malloc(message_length_);
            buffer_.reset(new Slice(slice, Slice::STEAL_REF));
            state_ = kExpectingMessageData;
          }
          continue;
        }
        case kExpectingMessageData: {
          uint8_t* end = const_cast<uint8_t*>(buffer_->end());
          *(end - message_length_) = c;
          message_length_--;
          if (message_length_ == 0) {
            if (compressed_flag_ == CompressedFlag::kCompressed &&
                compression_algorithm() == kGzip) {
              gpr_slice_buffer input;
              gpr_slice_buffer_init(&input);
              // TODO(fengli): Remove the additional copy.
              gpr_slice slice_input = gpr_slice_from_copied_buffer(
                  reinterpret_cast<const char*>(buffer_->begin()),
                  buffer_->size());
              gpr_slice_buffer_add(&input, slice_input);
              gpr_slice_buffer output;
              gpr_slice_buffer_init(&output);
              if (grpc_msg_decompress(
                      grpc_compression_algorithm::GRPC_COMPRESS_GZIP, &input,
                      &output) != 1) {
                return Status(StatusCode::INTERNAL,
                              "Failed to uncompress the GRPC data frame.");
              }
              gpr_slice slice_output = gpr_slice_buffer_take_first(&output);
              gpr_slice_unref(slice_input);
              Slice s(slice_output, Slice::STEAL_REF);
              results()->push_back(
                  std::unique_ptr<ByteBuffer>(new ByteBuffer(&s, 1)));
            } else {
              results()->push_back(std::unique_ptr<ByteBuffer>(
                  new ByteBuffer(buffer_.get(), 1)));
            }
            buffer_.reset();
            state_ = kExpectingCompressedFlag;
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
