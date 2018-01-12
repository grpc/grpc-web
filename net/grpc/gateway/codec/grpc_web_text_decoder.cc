#include "net/grpc/gateway/codec/grpc_web_text_decoder.h"

namespace grpc {
namespace gateway {

GrpcWebTextDecoder::GrpcWebTextDecoder() {}

GrpcWebTextDecoder::~GrpcWebTextDecoder() {}

Status GrpcWebTextDecoder::Decode() {
  std::vector<Slice> buffer;
  if (!base64_.Decode(*inputs(), &buffer)) {
    return Status(StatusCode::INVALID_ARGUMENT, "Invalid base64 inputs.");
  }

  inputs()->clear();
  for (Slice& s : buffer) {
    Append(s);
  }

  return GrpcWebDecoder::Decode();
}

}  // namespace gateway
}  // namespace grpc
