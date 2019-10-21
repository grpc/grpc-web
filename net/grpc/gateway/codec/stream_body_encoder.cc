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

#include "net/grpc/gateway/codec/stream_body_encoder.h"

#include <stddef.h>

#include <cstdint>
#include <cstring>
#include <string>
#include <vector>

#include "google/protobuf/any.pb.h"
#include "google/rpc/status.pb.h"
#include "net/grpc/gateway/protos/pair.pb.h"
#include "net/grpc/gateway/runtime/constants.h"
#include "third_party/grpc/include/grpcpp/support/slice.h"

namespace grpc {
namespace gateway {
namespace {
// The max integer can be represented in varint format with given number of
// bytes.
const size_t VARINT_RANGE[] = {0x7F, 0x3FFF, 0x1FFFFF, 0xFFFFFFF};

size_t get_varint_length(size_t length) {
  for (int i = 0; i < 4; i++) {
    if (length < VARINT_RANGE[i]) {
      return i + 1;
    }
  }
  return 5;
}
}  // namespace

// key: 00001, type: 010
const uint8_t MESSAGE_KEY_TYPE = 0x0A;
// key: 00010, type: 010
const uint8_t STATUS_KEY_TYPE = 0x12;
// key: 01111, type: 010
const uint8_t NOOP_KEY_TYPE = 0x7A;
const uint8_t PADDING_1[] = {NOOP_KEY_TYPE, 0x02, 0x00, 0x00};
const uint8_t PADDING_2[] = {NOOP_KEY_TYPE, 0x00};

StreamBodyEncoder::StreamBodyEncoder() {}

StreamBodyEncoder::~StreamBodyEncoder() {}

void StreamBodyEncoder::Encode(grpc::ByteBuffer* input,
                               std::vector<Slice>* result) {
  Encode(input, result, false);
}

void StreamBodyEncoder::Encode(grpc::ByteBuffer* input,
                               std::vector<Slice>* result, bool add_padding) {
  std::vector<Slice> input_slices;
  input->Dump(&input_slices);
  size_t message_length = input->Length();
  size_t message_varint_length = get_varint_length(message_length);
  size_t serialized_message_length = message_length + message_varint_length + 1;
  size_t padding = 3 - serialized_message_length % 3;
  size_t padding_size = 0;
  if (padding == 1) {
    padding_size = 4;
  } else if (padding == 2) {
    padding_size = 2;
  }
  grpc_slice message_slice = grpc_slice_malloc(
      serialized_message_length + (add_padding ? padding_size : 0));
  uint8_t* p = GRPC_SLICE_START_PTR(message_slice);
  *p++ = MESSAGE_KEY_TYPE;
  for (size_t i = 0; i < message_varint_length; i++) {
    *p = (message_length >> (i * 7)) & 0x7F;
    if (i != message_varint_length - 1) {
      *p |= 0x80;
    }
    p++;
  }
  for (const Slice& input_slice : input_slices) {
    memcpy(p, input_slice.begin(), input_slice.size());
    p += input_slice.size();
  }
  if (add_padding) {
    if (padding == 1) {
      memcpy(p, PADDING_1, 4);
    } else if (padding == 2) {
      memcpy(p, PADDING_2, 2);
    }
  }
  result->push_back(Slice(message_slice, Slice::STEAL_REF));
}

void StreamBodyEncoder::EncodeStatus(const grpc::Status& status,
                                     const Trailers* trailers,
                                     std::vector<Slice>* result) {
  EncodeStatus(status, trailers, result, false);
}

void StreamBodyEncoder::EncodeStatus(const grpc::Status& status,
                                     const Trailers* trailers,
                                     std::vector<Slice>* result,
                                     bool add_padding) {
  ::google::rpc::Status status_proto;
  status_proto.set_code(status.error_code());
  status_proto.set_message(status.error_message());
  if (trailers != nullptr) {
    for (auto& trailer : *trailers) {
      ::google::protobuf::Any* any = status_proto.add_details();
      any->set_type_url(kTypeUrlPair);
      Pair pair;
      pair.set_first(trailer.first);
      pair.set_second(trailer.second.data(), trailer.second.length());
      any->set_value(pair.SerializeAsString());
    }
  }

  std::string serialized_status_proto;
  status_proto.SerializeToString(&serialized_status_proto);
  size_t serialized_status_proto_length = serialized_status_proto.length();
  size_t serialized_status_proto_varint_length =
      get_varint_length(serialized_status_proto_length);
  size_t status_slice_length = serialized_status_proto_length +
                               serialized_status_proto_varint_length + 1;
  size_t padding = 3 - status_slice_length % 3;
  size_t padding_size = 0;
  if (padding == 1) {
    padding_size = 4;
  } else if (padding == 2) {
    padding_size = 2;
  }
  grpc_slice status_slice =
      grpc_slice_malloc(status_slice_length + (add_padding ? padding_size : 0));
  uint8_t* p = GRPC_SLICE_START_PTR(status_slice);
  *p++ = STATUS_KEY_TYPE;
  for (size_t i = 0; i < serialized_status_proto_varint_length; i++) {
    *p = (serialized_status_proto_length >> (i * 7)) & 0x7F;
    if (i != serialized_status_proto_varint_length - 1) {
      *p |= 0x80;
    }
    p++;
  }
  memcpy(p, serialized_status_proto.c_str(), serialized_status_proto_length);
  p += serialized_status_proto_length;
  if (add_padding) {
    if (padding == 1) {
      memcpy(p, PADDING_1, 4);
    } else if (padding == 2) {
      memcpy(p, PADDING_2, 2);
    }
  }
  result->push_back(Slice(status_slice, Slice::STEAL_REF));
}

}  // namespace gateway
}  // namespace grpc
