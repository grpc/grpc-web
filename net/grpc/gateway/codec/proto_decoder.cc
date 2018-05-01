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

#include "net/grpc/gateway/codec/proto_decoder.h"

#include "third_party/grpc/include/grpcpp/support/byte_buffer.h"
#include "third_party/grpc/include/grpcpp/support/status.h"

namespace grpc {
namespace gateway {

ProtoDecoder::ProtoDecoder() {}

ProtoDecoder::~ProtoDecoder() {}

Status ProtoDecoder::Decode() {
  if (inputs()->empty()) {
    Slice slice(grpc_empty_slice(), Slice::STEAL_REF);
    ByteBuffer* buffer = new ByteBuffer(&slice, 1);
    results()->push_back(std::unique_ptr<ByteBuffer>(buffer));
  } else {
    ByteBuffer* buffer = new ByteBuffer(inputs()->data(), inputs()->size());
    results()->push_back(std::unique_ptr<ByteBuffer>(buffer));
  }
  inputs()->clear();
  return Status::OK;
}

}  // namespace gateway
}  // namespace grpc
