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

#ifndef NET_GRPC_GATEWAY_CODEC_STREAM_BODY_DECODER_H_
#define NET_GRPC_GATEWAY_CODEC_STREAM_BODY_DECODER_H_

#include <memory>
#include <vector>

#include "net/grpc/gateway/codec/decoder.h"
#include "third_party/grpc/include/grpcpp/support/byte_buffer.h"
#include "third_party/grpc/include/grpcpp/support/slice.h"

namespace grpc {
namespace gateway {

class StreamBodyDecoder : public Decoder {
 public:
  enum State {
    // The initial decode state.
    EXPECTING_MESSAGE_KEY_TYPE,
    // The key and type of a proto field has been read.
    EXPECTING_MESSAGE_VARINT_LENGTH,
    // The length of a proto field has been read.
    EXPECTING_MESSAGE_DATA
  };

  StreamBodyDecoder();
  ~StreamBodyDecoder() override;
  StreamBodyDecoder(const StreamBodyDecoder&) = delete;
  StreamBodyDecoder& operator=(const StreamBodyDecoder&) = delete;

  Status Decode() override;

 private:
  State state_;
  size_t varint_value_;
  size_t varint_bytes_;
  std::unique_ptr<Slice> buffer_;
};

}  // namespace gateway
}  // namespace grpc
#endif  // NET_GRPC_GATEWAY_CODEC_STREAM_BODY_DECODER_H_
