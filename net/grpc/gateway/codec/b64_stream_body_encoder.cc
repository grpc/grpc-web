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

#include "net/grpc/gateway/codec/b64_stream_body_encoder.h"

namespace grpc {
namespace gateway {

B64StreamBodyEncoder::B64StreamBodyEncoder() {}

B64StreamBodyEncoder::~B64StreamBodyEncoder() {}

void B64StreamBodyEncoder::Encode(grpc::ByteBuffer* input,
                                  std::vector<Slice>* result) {
  std::vector<Slice> buffer;
  StreamBodyEncoder::Encode(input, &buffer, true);
  base64_.Encode(buffer, result);
}

void B64StreamBodyEncoder::EncodeStatus(const grpc::Status& status,
                                        const Trailers* trailers,
                                        std::vector<Slice>* result) {
  std::vector<Slice> buffer;
  StreamBodyEncoder::EncodeStatus(status, trailers, &buffer, true);
  base64_.Encode(buffer, result);
}

}  // namespace gateway
}  // namespace grpc
