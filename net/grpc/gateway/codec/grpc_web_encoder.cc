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

#include "net/grpc/gateway/codec/grpc_web_encoder.h"

#include <cstdint>
#include <cstring>
#include <vector>

#include "net/grpc/gateway/runtime/types.h"
#include "third_party/absl/strings/str_format.h"
#include "third_party/grpc/include/grpcpp/support/byte_buffer.h"
#include "third_party/grpc/include/grpcpp/support/slice.h"

namespace grpc {
namespace gateway {
namespace {

const char kGrpcStatus[] = "grpc-status: %i\r\n";
const char kGrpcMessage[] = "grpc-message: %s\r\n";

// GRPC Web message frame.
const uint8_t GRPC_WEB_FH_DATA = 0b0u;
// GRPC Web trailer frame.
const uint8_t GRPC_WEB_FH_TRAILER = 0b10000000u;

// Creates a new GRPC data frame with the given flags and length.
// @param flags supplies the GRPC data frame flags.
// @param length supplies the GRPC data frame length.
// @param output the buffer to store the encoded data, it's size must be 5.
void NewFrame(uint8_t flags, uint64_t length, uint8_t* output) {
  output[0] = flags;
  output[1] = static_cast<uint8_t>(length >> 24);
  output[2] = static_cast<uint8_t>(length >> 16);
  output[3] = static_cast<uint8_t>(length >> 8);
  output[4] = static_cast<uint8_t>(length);
}
}  // namespace

GrpcWebEncoder::GrpcWebEncoder() {}

GrpcWebEncoder::~GrpcWebEncoder() {}

void GrpcWebEncoder::Encode(grpc::ByteBuffer* input,
                            std::vector<Slice>* result) {
  uint8_t header[5];
  NewFrame(GRPC_WEB_FH_DATA, input->Length(), header);
  result->push_back(
      Slice(gpr_slice_from_copied_buffer(reinterpret_cast<char*>(header), 5),
            Slice::STEAL_REF));
  std::vector<Slice> buffer;
  // TODO(fengli): Optimize if needed. Today we cannot dump data to the result
  // directly since it will clear the target.
  input->Dump(&buffer);
  for (Slice& s : buffer) {
    result->push_back(s);
  }
}

void GrpcWebEncoder::EncodeStatus(const grpc::Status& status,
                                  const Trailers* trailers,
                                  std::vector<Slice>* result) {
  std::vector<Slice> buffer;
  uint64_t length = 0;

  // Encodes GRPC status.
  size_t grpc_status_size =
      absl::SNPrintF(nullptr, 0, kGrpcStatus, status.error_code());
  grpc_slice grpc_status = grpc_slice_malloc(grpc_status_size + 1);
  absl::SNPrintF(reinterpret_cast<char*>(GPR_SLICE_START_PTR(grpc_status)),
                 grpc_status_size + 1, kGrpcStatus, status.error_code());
  GPR_SLICE_SET_LENGTH(grpc_status, grpc_status_size);
  buffer.push_back(Slice(grpc_status, Slice::STEAL_REF));
  length += grpc_status_size;

  // Encodes GRPC message.
  if (!status.error_message().empty()) {
    size_t grpc_message_size =
        absl::SNPrintF(nullptr, 0, kGrpcMessage, status.error_message());
    grpc_slice grpc_message = grpc_slice_malloc(grpc_message_size + 1);
    absl::SNPrintF(reinterpret_cast<char*>(GPR_SLICE_START_PTR(grpc_message)),
                   grpc_message_size + 1, kGrpcMessage, status.error_message());
    GPR_SLICE_SET_LENGTH(grpc_message, grpc_message_size);
    buffer.push_back(Slice(grpc_message, Slice::STEAL_REF));
    length += grpc_message_size;
  }

  // Encodes GRPC trailers.
  if (trailers != nullptr) {
    for (auto& trailer : *trailers) {
      size_t grpc_trailer_size =
          trailer.first.size() + trailer.second.size() + 4;
      grpc_slice grpc_trailer = grpc_slice_malloc(grpc_trailer_size);
      uint8_t* p = GPR_SLICE_START_PTR(grpc_trailer);
      memcpy(p, trailer.first.c_str(), trailer.first.size());
      p += trailer.first.size();
      memcpy(p, ": ", 2);
      p += 2;
      memcpy(p, trailer.second.data(), trailer.second.size());
      p += trailer.second.size();
      memcpy(p, "\r\n", 2);
      buffer.push_back(Slice(grpc_trailer, Slice::STEAL_REF));
      length += grpc_trailer_size;
    }
  }

  // Encodes GRPC trailer frame.
  grpc_slice header = grpc_slice_malloc(5);
  NewFrame(GRPC_WEB_FH_TRAILER, length, GPR_SLICE_START_PTR(header));
  result->push_back(Slice(header, Slice::STEAL_REF));
  result->insert(result->end(), buffer.begin(), buffer.end());
}

}  // namespace gateway
}  // namespace grpc
