#include "net/grpc/gateway/codec/grpc_web_text_encoder.h"

namespace grpc {
namespace gateway {

GrpcWebTextEncoder::GrpcWebTextEncoder() {}

GrpcWebTextEncoder::~GrpcWebTextEncoder() {}

void GrpcWebTextEncoder::Encode(grpc::ByteBuffer* input,
                                std::vector<Slice>* result) {
  std::vector<Slice> buffer;
  GrpcWebEncoder::Encode(input, &buffer);
  base64_.Encode(buffer, result);
}

void GrpcWebTextEncoder::EncodeStatus(const grpc::Status& status,
                                      const Trailers* trailers,
                                      std::vector<Slice>* result) {
  std::vector<Slice> buffer;
  GrpcWebEncoder::EncodeStatus(status, trailers, &buffer);
  base64_.Encode(buffer, result);
}

}  // namespace gateway
}  // namespace grpc
