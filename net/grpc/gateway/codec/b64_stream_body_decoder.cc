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

#include "net/grpc/gateway/codec/b64_stream_body_decoder.h"

#include <vector>

#include "net/grpc/gateway/codec/decoder.h"
#include "third_party/grpc/include/grpc++/support/slice.h"
#include "third_party/grpc/include/grpc++/support/status.h"

namespace grpc {
namespace gateway {

B64StreamBodyDecoder::B64StreamBodyDecoder() {}

B64StreamBodyDecoder::~B64StreamBodyDecoder() {}

Status B64StreamBodyDecoder::Decode() {
  std::vector<Slice> buffer;
  if (!base64_.Decode(*inputs(), &buffer)) {
    return Status(StatusCode::INVALID_ARGUMENT, "Invalid base64 inputs.");
  }

  inputs()->clear();
  for (Slice& s : buffer) {
    Append(s);
  }

  return StreamBodyDecoder::Decode();
}

}  // namespace gateway
}  // namespace grpc
