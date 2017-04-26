#include "net/grpc/gateway/codec/proto_encoder.h"

#include <utility>
#include <vector>

#include "google/protobuf/any.pb.h"
#include "net/grpc/gateway/protos/pair.pb.h"
#include "net/grpc/gateway/protos/stream_body.pb.h"
#include "net/grpc/gateway/runtime/constants.h"
#include "net/grpc/gateway/runtime/types.h"
#include "third_party/grpc/include/grpc++/support/byte_buffer.h"
#include "third_party/grpc/include/grpc++/support/slice.h"
#include "third_party/grpc/include/grpc/slice.h"

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
      pair.SerializeToString(any->mutable_value());
    }
  }

  grpc_slice status_slice = grpc_slice_malloc(status_proto.ByteSizeLong());
  status_proto.SerializeToArray(GPR_SLICE_START_PTR(status_slice),
                                GPR_SLICE_LENGTH(status_slice));
  result->push_back(Slice(status_slice, Slice::STEAL_REF));
}

}  // namespace gateway
}  // namespace grpc
