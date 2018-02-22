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

#ifndef NET_GRPC_GATEWAY_CODEC_GRPC_WEB_DECODER_H_
#define NET_GRPC_GATEWAY_CODEC_GRPC_WEB_DECODER_H_

#include <cstdint>
#include <memory>

#include "net/grpc/gateway/codec/decoder.h"
#include "third_party/grpc/include/grpc++/support/slice.h"

namespace grpc {
namespace gateway {

class GrpcWebDecoder : public Decoder {
 public:
  static const uint8_t kGrpcWebMessage;

  enum State : uint8_t {
    // The initial decode state, expecting the flags (1 byte).
    kExpectingFlags,
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

  GrpcWebDecoder();
  virtual ~GrpcWebDecoder();

  // GrpcWebDecoder is neither copyable nor movable.
  GrpcWebDecoder(const GrpcWebDecoder&) = delete;
  GrpcWebDecoder& operator=(const GrpcWebDecoder&) = delete;

  Status Decode() override;

 private:
  State state_;
  // The message length of the current decoding GRPC-Web frame.
  uint32_t message_length_;
  // The data buffered for the current decoding GRPC-Web frame.
  std::unique_ptr<Slice> buffer_;
};

}  // namespace gateway
}  // namespace grpc
#endif  // NET_GRPC_GATEWAY_CODEC_GRPC_WEB_DECODER_H_
