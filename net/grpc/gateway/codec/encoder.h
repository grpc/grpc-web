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

#ifndef NET_GRPC_GATEWAY_CODEC_ENCODER_H_
#define NET_GRPC_GATEWAY_CODEC_ENCODER_H_

#include "net/grpc/gateway/runtime/types.h"
#include "third_party/grpc/include/grpcpp/support/byte_buffer.h"

namespace grpc {
namespace gateway {

// Interface for GRPC-Gateway encoders. A encoder instance records the internal
// states during the processing of a response (stream). Encoder encodes the GRPC
// response to different front end protocols.
class Encoder {
 public:
  Encoder();
  virtual ~Encoder();
  Encoder(const Encoder&) = delete;
  Encoder& operator=(const Encoder&) = delete;

  // Encodes a GRPC response message to the front end protocol.
  virtual void Encode(grpc::ByteBuffer* input, std::vector<Slice>* result) = 0;

  // Encodes a GRPC response status to the front end protocol.
  virtual void EncodeStatus(const grpc::Status& status,
                            std::vector<Slice>* result);

  // Encodes a GRPC response status and trailers to the frontend protocol.
  virtual void EncodeStatus(const grpc::Status& status,
                            const Trailers* trailers,
                            std::vector<Slice>* result) = 0;
};

}  // namespace gateway
}  // namespace grpc
#endif  // NET_GRPC_GATEWAY_CODEC_ENCODER_H_
