#include "net/grpc/gateway/codec/grpc_decoder.h"

#include "net/grpc/gateway/log.h"
#include "net/grpc/gateway/utils.h"
#include "third_party/grpc/src/core/lib/compression/message_compress.h"
#include "third_party/grpc/src/core/lib/iomgr/exec_ctx.h"

namespace grpc {
namespace gateway {
GrpcDecoder::GrpcDecoder()
    : state_(kExpectingCompressedFlag),
      compression_algorithm_(kIdentity),
      compressed_flag_(0),
      message_length_(0) {}
GrpcDecoder::~GrpcDecoder() {}

Status GrpcDecoder::Decode() {
  grpc_core::ExecCtx exec_ctx;
  for (const Slice& slice : *inputs()) {
    if (slice.size() == 0) {
      continue;
    }

    for (size_t i = 0; i < slice.size(); i++) {
      uint8_t c = *(slice.begin() + i);
      switch (state_) {
        case kExpectingCompressedFlag: {
          if (c != CompressedFlag::kUncompressed &&
              c != CompressedFlag::kCompressed) {
            // TODO(fengli): The following code is repeated 12 times. Extract it
            // into a function or a macro.
            Status status(StatusCode::INVALID_ARGUMENT,
                          Format("Receives invalid compressed flag: %c.", c));
            DEBUG("%s", status.error_message().c_str());

            return status;
          }
          compressed_flag_ = c;
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
            state_ = kExpectingCompressedFlag;
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
            if (compressed_flag_ == CompressedFlag::kCompressed &&
                compression_algorithm() == kGzip) {
              grpc_slice_buffer input;
              grpc_slice_buffer_init(&input);
              // TODO(fengli): Remove the additional copy.
              grpc_slice slice_input = grpc_slice_from_copied_buffer(
                  reinterpret_cast<const char*>(buffer_->begin()),
                  buffer_->size());
              grpc_slice_buffer_add(&input, slice_input);
              grpc_slice_buffer output;
              grpc_slice_buffer_init(&output);
              if (grpc_msg_decompress(grpc_message_compression_algorithm::
                                          GRPC_MESSAGE_COMPRESS_GZIP,
                                      &input, &output) != 1) {
                grpc_slice_buffer_destroy(&input);
                grpc_slice_buffer_destroy(&output);

                return Status(StatusCode::INTERNAL,
                              "Failed to uncompress the GRPC data frame.");
              }
              std::vector<Slice> s;
              while (output.count > 0) {
                s.push_back(Slice(grpc_slice_buffer_take_first(&output),
                                  Slice::STEAL_REF));
              }
              results()->push_back(std::unique_ptr<ByteBuffer>(
                  new ByteBuffer(s.data(), s.size())));
              grpc_slice_buffer_destroy(&input);
              grpc_slice_buffer_destroy(&output);
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
