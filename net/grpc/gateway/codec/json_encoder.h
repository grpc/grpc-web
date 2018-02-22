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

#ifndef NET_GRPC_GATEWAY_CODEC_JSON_ENCODER_H_
#define NET_GRPC_GATEWAY_CODEC_JSON_ENCODER_H_

#include <vector>

#include "net/grpc/gateway/codec/base64.h"
#include "net/grpc/gateway/codec/encoder.h"
#include "third_party/grpc/include/grpc++/support/byte_buffer.h"
#include "third_party/grpc/include/grpc++/support/slice.h"

namespace grpc {
namespace gateway {

class JsonEncoder : public Encoder {
 public:
  JsonEncoder();
  ~JsonEncoder() override;
  JsonEncoder(const JsonEncoder&) = delete;
  JsonEncoder& operator=(const JsonEncoder&) = delete;

  void Encode(grpc::ByteBuffer* input, std::vector<Slice>* result) override;
  void EncodeStatus(const grpc::Status& status, const Trailers* trailers,
                    std::vector<Slice>* result) override;

 private:
  bool is_first_message_;
  Base64 base64_;
};

}  // namespace gateway
}  // namespace grpc
#endif  // NET_GRPC_GATEWAY_CODEC_JSON_ENCODER_H_
