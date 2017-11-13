#include "net/grpc/gateway/codec/proto_decoder.h"

#include "third_party/grpc/include/grpc++/support/byte_buffer.h"
#include "third_party/grpc/include/grpc++/support/status.h"

namespace grpc {
namespace gateway {

ProtoDecoder::ProtoDecoder() {}

ProtoDecoder::~ProtoDecoder() {}

Status ProtoDecoder::Decode() {
  if (inputs()->empty()) {
    Slice slice(grpc_empty_slice(), Slice::STEAL_REF);
    ByteBuffer* buffer = new ByteBuffer(&slice, 1);
    results()->push_back(std::unique_ptr<ByteBuffer>(buffer));
  } else {
    ByteBuffer* buffer = new ByteBuffer(inputs()->data(), inputs()->size());
    results()->push_back(std::unique_ptr<ByteBuffer>(buffer));
  }
  inputs()->clear();
  return Status::OK;
}

}  // namespace gateway
}  // namespace grpc
