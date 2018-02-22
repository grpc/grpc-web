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

#include "net/grpc/gateway/codec/b64_proto_encoder.h"

namespace grpc {
namespace gateway {

B64ProtoEncoder::B64ProtoEncoder() {}

B64ProtoEncoder::~B64ProtoEncoder() {}

void B64ProtoEncoder::Encode(grpc::ByteBuffer* input,
                             std::vector<Slice>* result) {
  std::vector<Slice> buffer;
  ProtoEncoder::Encode(input, &buffer);
  base64_.Encode(buffer, result);
}

void B64ProtoEncoder::EncodeStatus(const grpc::Status& status,
                                   const Trailers* trailers,
                                   std::vector<Slice>* result) {
  std::vector<Slice> buffer;
  ProtoEncoder::EncodeStatus(status, trailers, &buffer);
  base64_.Encode(buffer, result);
}

}  // namespace gateway
}  // namespace grpc
