#include "net/grpc/gateway/codec/grpc_encoder.h"

#include "third_party/grpc/include/grpc++/support/slice.h"

namespace grpc {
namespace gateway {
GrpcEncoder::GrpcEncoder() {}
GrpcEncoder::~GrpcEncoder() {}

void GrpcEncoder::Encode(grpc::ByteBuffer* input, std::vector<Slice>* result) {
  std::vector<Slice> input_slices;
  input->Dump(&input_slices);
  uint32_t message_length = input->Length();
  gpr_slice message_slice = gpr_slice_malloc(message_length + 5);
  uint8_t* p = GPR_SLICE_START_PTR(message_slice);
  *p++ = 0;  // no compression.
  *p++ = (message_length & 0xFF000000) >> 24;
  *p++ = (message_length & 0x00FF0000) >> 16;
  *p++ = (message_length & 0x0000FF00) >> 8;
  *p++ = message_length & 0x000000FF;
  for (const Slice& input_slice : input_slices) {
    memcpy(p, input_slice.begin(), input_slice.size());
  }
  result->push_back(Slice(message_slice, Slice::STEAL_REF));
}

void GrpcEncoder::EncodeStatus(const grpc::Status& status,
                               const Trailers& trailers,
                               std::vector<Slice>* result) {}
}  // namespace gateway
}  // namespace grpc
