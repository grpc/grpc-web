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

#include "net/grpc/gateway/codec/grpc_encoder.h"

#include "third_party/grpc/include/grpcpp/support/slice.h"

namespace grpc {
namespace gateway {
GrpcEncoder::GrpcEncoder() {}
GrpcEncoder::~GrpcEncoder() {}

void GrpcEncoder::Encode(grpc::ByteBuffer* input, std::vector<Slice>* result) {
  std::vector<Slice> input_slices;
  input->Dump(&input_slices);
  uint32_t message_length = input->Length();
  grpc_slice message_slice = grpc_slice_malloc(message_length + 5);
  uint8_t* p = GRPC_SLICE_START_PTR(message_slice);
  *p++ = 0;  // no compression.
  *p++ = (message_length & 0xFF000000) >> 24;
  *p++ = (message_length & 0x00FF0000) >> 16;
  *p++ = (message_length & 0x0000FF00) >> 8;
  *p++ = message_length & 0x000000FF;
  for (const Slice& input_slice : input_slices) {
    memcpy(p, input_slice.begin(), input_slice.size());
    p += input_slice.size();
  }
  result->push_back(Slice(message_slice, Slice::STEAL_REF));
}

void GrpcEncoder::EncodeStatus(const grpc::Status& status,
                               const Trailers* trailers,
                               std::vector<Slice>* result) {}
}  // namespace gateway
}  // namespace grpc
