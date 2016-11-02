#include "net/grpc/gateway/codec/b64_proto_decoder.h"

namespace grpc {
namespace gateway {

B64ProtoDecoder::B64ProtoDecoder() {}

B64ProtoDecoder::~B64ProtoDecoder() {}

Status B64ProtoDecoder::Decode() {
  std::vector<Slice> buffer;
  if (!base64_.Decode(*inputs(), &buffer)) {
    return Status(StatusCode::INVALID_ARGUMENT, "Invalid base64 inputs.");
  }

  inputs()->clear();
  for (Slice& s : buffer) {
    Append(s);
  }

  return ProtoDecoder::Decode();
}

}  // namespace gateway
}  // namespace grpc
