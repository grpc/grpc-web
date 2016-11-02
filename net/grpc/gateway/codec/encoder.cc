#include "net/grpc/gateway/codec/encoder.h"

namespace grpc {
namespace gateway {

Encoder::Encoder() {}

Encoder::~Encoder() {}

void Encoder::EncodeStatus(const grpc::Status& status,
                           std::vector<Slice>* result) {
  EncodeStatus(status, nullptr, result);
}

}  // namespace gateway
}  // namespace grpc
