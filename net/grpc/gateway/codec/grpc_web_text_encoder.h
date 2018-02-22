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

#ifndef NET_GRPC_GATEWAY_CODEC_GRPC_WEB_TEXT_ENCODER_H_
#define NET_GRPC_GATEWAY_CODEC_GRPC_WEB_TEXT_ENCODER_H_

#include "net/grpc/gateway/codec/base64.h"
#include "net/grpc/gateway/codec/grpc_web_encoder.h"

namespace grpc {
namespace gateway {

class GrpcWebTextEncoder : public GrpcWebEncoder {
 public:
  GrpcWebTextEncoder();
  ~GrpcWebTextEncoder() override;
  GrpcWebTextEncoder(const GrpcWebTextEncoder&) = delete;
  GrpcWebTextEncoder& operator=(const GrpcWebTextEncoder&) = delete;

  void Encode(grpc::ByteBuffer* input, std::vector<Slice>* result) override;
  void EncodeStatus(const grpc::Status& status, const Trailers* trailers,
                    std::vector<Slice>* result) override;

 private:
  Base64 base64_;
};

}  // namespace gateway
}  // namespace grpc

#endif  // NET_GRPC_GATEWAY_CODEC_GRPC_WEB_TEXT_ENCODER_H_
