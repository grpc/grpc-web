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

#include "net/grpc/gateway/codec/proto_encoder.h"

#include <utility>
#include <vector>

#include "google/protobuf/any.pb.h"
#include "google/rpc/status.pb.h"
#include "net/grpc/gateway/protos/pair.pb.h"
#include "net/grpc/gateway/runtime/constants.h"
#include "net/grpc/gateway/runtime/types.h"
#include "third_party/grpc/include/grpc/slice.h"
#include "third_party/grpc/include/grpcpp/support/byte_buffer.h"
#include "third_party/grpc/include/grpcpp/support/slice.h"

namespace grpc {
namespace gateway {

ProtoEncoder::ProtoEncoder() {}

ProtoEncoder::~ProtoEncoder() {}

void ProtoEncoder::Encode(grpc::ByteBuffer* input, std::vector<Slice>* result) {
  input->Dump(result);
}

void ProtoEncoder::EncodeStatus(const grpc::Status& status,
                                const Trailers* trailers,
                                std::vector<Slice>* result) {
  google::rpc::Status status_proto;
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

  grpc_slice status_slice = grpc_slice_malloc(status_proto.ByteSizeLong());
  status_proto.SerializeToArray(GPR_SLICE_START_PTR(status_slice),
                                GPR_SLICE_LENGTH(status_slice));
  result->push_back(Slice(status_slice, Slice::STEAL_REF));
}

}  // namespace gateway
}  // namespace grpc
