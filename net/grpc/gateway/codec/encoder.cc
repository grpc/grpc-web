#include "net/grpc/gateway/codec/encoder.h"

namespace grpc {
namespace gateway {
namespace {

Trailers kEmptyTrailers;

}  // namespace

Encoder::Encoder() {}

Encoder::~Encoder() {}

void Encoder::EncodeStatus(const grpc::Status& status,
                           std::vector<Slice>* result) {
  EncodeStatus(status, kEmptyTrailers, result);
}

}  // namespace gateway
}  // namespace grpc
