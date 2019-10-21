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

#include "net/grpc/gateway/codec/json_encoder.h"

#include <string>

#include "google/protobuf/any.pb.h"
#include "google/rpc/status.pb.h"
#include "net/grpc/gateway/protos/pair.pb.h"
#include "net/grpc/gateway/runtime/constants.h"
#include "third_party/grpc/include/grpc/slice.h"
#include "third_party/grpc/include/grpcpp/support/config.h"

namespace grpc {
namespace gateway {

const char kJsonArrayFirstMessagePrefix[] = "[{\"1\":\"";
const char kJsonArrayMessagePrefix[] = ",{\"1\":\"";
const char kDoubleQuote[] = "\"}";
const char kJsonArrayStatusPrefix[] = ",{\"2\":\"";
const char kJsonArrayStatusOnlyPrefix[] = "[{\"2\":\"";
const char kJsonArrayStatusSurfix[] = "\"}]";
void do_nothing() {}

JsonEncoder::JsonEncoder() : is_first_message_(true) {}

JsonEncoder::~JsonEncoder() {}

void JsonEncoder::Encode(grpc::ByteBuffer* input, std::vector<Slice>* result) {
  std::vector<Slice> input_slices;
  input->Dump(&input_slices);
  if (is_first_message_) {
    is_first_message_ = false;
    grpc_slice s = grpc_slice_from_static_string(kJsonArrayFirstMessagePrefix);
    result->push_back(Slice(s, Slice::STEAL_REF));
  } else {
    grpc_slice s = grpc_slice_from_static_string(kJsonArrayMessagePrefix);
    result->push_back(Slice(s, Slice::STEAL_REF));
  }
  base64_.Encode(input_slices, result);
  grpc_slice s = grpc_slice_from_static_string(kDoubleQuote);
  result->push_back(Slice(s, Slice::STEAL_REF));
}

void JsonEncoder::EncodeStatus(const grpc::Status& status,
                               const Trailers* trailers,
                               std::vector<Slice>* result) {
  if (is_first_message_) {
    grpc_slice prefix =
        grpc_slice_from_static_string(kJsonArrayStatusOnlyPrefix);
    result->push_back(Slice(prefix, Slice::STEAL_REF));
  } else {
    grpc_slice prefix = grpc_slice_from_static_string(kJsonArrayStatusPrefix);
    result->push_back(Slice(prefix, Slice::STEAL_REF));
  }
  std::vector<Slice> input_slices;
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
      // TODO(fengli): Change to open source protobuf.
      any->set_value(pair.SerializeAsString());
    }
  }

  std::string serialized_status_proto;
  status_proto.SerializeToString(&serialized_status_proto);
  grpc_slice status_slice =
      grpc_slice_from_copied_string(serialized_status_proto.c_str());
  input_slices.push_back(Slice(status_slice, Slice::STEAL_REF));
  base64_.Encode(input_slices, result);
  grpc_slice surfix = grpc_slice_from_static_string(kJsonArrayStatusSurfix);
  result->push_back(Slice(surfix, Slice::STEAL_REF));
}
}  // namespace gateway
}  // namespace grpc
