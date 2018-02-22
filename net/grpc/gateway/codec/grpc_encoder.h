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

#ifndef NET_GRPC_GATEWAY_CODEC_GRPC_ENCODER_H_
#define NET_GRPC_GATEWAY_CODEC_GRPC_ENCODER_H_

#include "net/grpc/gateway/codec/encoder.h"

namespace grpc {
namespace gateway {

// Encoder for GRPC to GRPC traffic. Encodes the response headers, response
// messages, response status and response trailers to the raw GRPC wire format
// base on HTTP2.
class GrpcEncoder : public Encoder {
 public:
  GrpcEncoder();
  ~GrpcEncoder() override;
  GrpcEncoder(const GrpcEncoder&) = delete;
  GrpcEncoder& operator=(const GrpcEncoder&) = delete;

  // Encodes a GRPC response message to raw GRPC wire format base on HTTP2.
  void Encode(grpc::ByteBuffer* input, std::vector<Slice>* result) override;

  // Encodes the GRPC response status and trailers to raw GRPC wire format base
  // on HTTP2.
  void EncodeStatus(const grpc::Status& status, const Trailers* trailers,
                    std::vector<Slice>* result) override;
};
}  // namespace gateway
}  // namespace grpc
#endif  // NET_GRPC_GATEWAY_CODEC_GRPC_ENCODER_H_
