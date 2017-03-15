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
