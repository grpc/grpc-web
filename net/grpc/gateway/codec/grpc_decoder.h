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

#ifndef NET_GRPC_GATEWAY_CODEC_GRPC_DECODER_H_
#define NET_GRPC_GATEWAY_CODEC_GRPC_DECODER_H_

#include <cstdint>
#include <memory>

#include "net/grpc/gateway/codec/decoder.h"
#include "third_party/grpc/include/grpc++/support/slice.h"

namespace grpc {
namespace gateway {

// Decodes the GRPC requests from raw GRPC frames over HTTP2 to a series of
// protobuf messages.
class GrpcDecoder : public Decoder {
 public:
  enum State {
    // The initial decode state, expecting the compression flag (1 byte).
    kExpectingCompressedFlag,
    // Expecting the 1st byte of message length (4 bytes in total).
    kExpectingMessageLengthByte0,
    // Expecting the 2nd byte of message length (4 bytes in total).
    kExpectingMessageLengthByte1,
    // Expecting the 3rd byte of message length (4 bytes in total).
    kExpectingMessageLengthByte2,
    // Expecting the 4th byte of message length (4 bytes in total).
    kExpectingMessageLengthByte3,
    // Expecting the message data.
    kExpectingMessageData
  };

  enum CompressionAlgorithm { kIdentity = 0, kGzip = 1, kSnappy = 2 };

  enum CompressedFlag { kUncompressed = 0, kCompressed = 1 };

  GrpcDecoder();
  ~GrpcDecoder() override;
  GrpcDecoder(const GrpcDecoder&) = delete;
  GrpcDecoder& operator=(const GrpcDecoder&) = delete;

  Status Decode() override;

  // Sets the GRPC compression algorithm to be used when receiving a compressed
  // data frame.
  void set_compression_algorithm(CompressionAlgorithm compression_algorithm) {
    compression_algorithm_ = compression_algorithm;
  }

  // Returns the GRPC compression algorithm to be used when receiving a
  // compressed data frame.
  CompressionAlgorithm compression_algorithm() {
    return compression_algorithm_;
  }

 private:
  State state_;
  // The compression algorithm used to decode the GRPC frame.
  CompressionAlgorithm compression_algorithm_;
  // The compressed of the current decoding GRPC frame.
  uint8_t compressed_flag_;
  // The message length of the current decoding GRPC frame.
  uint32_t message_length_;
  // The data buffered for the current decoding GRPC frame.
  std::unique_ptr<Slice> buffer_;
};
}  // namespace gateway
}  // namespace grpc

#endif  // NET_GRPC_GATEWAY_CODEC_GRPC_DECODER_H_
