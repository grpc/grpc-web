#include "net/grpc/gateway/codec/decoder.h"

namespace grpc {
namespace gateway {

Decoder::Decoder() {}

Decoder::~Decoder() {}

void Decoder::Append(Slice input) { inputs_.push_back(input); }

}  // namespace gateway
}  // namespace grpc
