#include "net/grpc/gateway/codec/proto_encoder.h"

#include <stddef.h>
#include <cstdint>
#include <cstring>
#include <string>
#include <vector>

#include "net/grpc/gateway/portable_any.pb.h"
#include "net/grpc/gateway/portable_pair.pb.h"
#include "net/grpc/gateway/portable_status.pb.h"
#include "net/grpc/gateway/runtime/constants.h"
#include "third_party/grpc/include/grpc++/support/slice.h"

namespace grpc {
namespace gateway {
namespace {
// The max integer can be represented in varint format with given number of
// bytes.
const size_t VARINT_RANGE[] = {0x7F, 0x3FFF, 0x1FFFFF, 0xFFFFFFF};

size_t get_varint_length(size_t length) {
  for (int i = 0; i < 4; i++) {
    if (length < VARINT_RANGE[i]) {
      return i + 1;
    }
  }
  return 5;
}
}  // namespace

// key: 00001, type: 010
const uint8_t MESSAGE_KEY_TYPE = 0x0A;
// key: 00010, type: 010
const uint8_t STATUS_KEY_TYPE = 0x12;

ProtoEncoder::ProtoEncoder() {}

ProtoEncoder::~ProtoEncoder() {}

void ProtoEncoder::Encode(grpc::ByteBuffer* input, std::vector<Slice>* result) {
  std::vector<Slice> input_slices;
  input->Dump(&input_slices);
  size_t message_length = input->Length();
  size_t message_varint_length = get_varint_length(message_length);
  gpr_slice message_slice =
      gpr_slice_malloc(message_length + message_varint_length + 1);
  uint8_t* p = GPR_SLICE_START_PTR(message_slice);
  *p++ = MESSAGE_KEY_TYPE;
  for (int i = 0; i < message_varint_length; i++) {
    *p = (message_length >> (i * 7)) & 0x7F;
    if (i != message_varint_length - 1) {
      *p |= 0x80;
    }
    p++;
  }
  for (const Slice& input_slice : input_slices) {
    memcpy(p, input_slice.begin(), input_slice.size());
  }
  result->push_back(Slice(message_slice, Slice::STEAL_REF));
}
void ProtoEncoder::EncodeStatus(const grpc::Status& status,
                                const Trailers& trailers,
                                std::vector<Slice>* result) {
  google::rpc::Status status_proto;
  status_proto.set_code(status.error_code());
  status_proto.set_message(status.error_message());
  for (auto& trailer : trailers) {
    ::google::protobuf::Any* any = status_proto.add_details();
    any->set_type_url(kTypeUrlPair);
    Pair pair;
    pair.set_first(trailer.first);
    pair.set_second(trailer.second.data(), trailer.second.length());
    pair.SerializeToString(any->mutable_value());
  }

  std::string status_string;
  status_proto.SerializeToString(&status_string);
  size_t status_string_length = status_string.length();
  size_t status_string_varint_length = get_varint_length(status_string_length);
  gpr_slice status_slice =
      gpr_slice_malloc(status_string_length + status_string_varint_length + 1);
  uint8_t* p = GPR_SLICE_START_PTR(status_slice);
  *p++ = STATUS_KEY_TYPE;
  for (int i = 0; i < status_string_varint_length; i++) {
    *p = (status_string_length >> (i * 7)) & 0x7F;
    if (i != status_string_varint_length - 1) {
      *p |= 0x80;
    }
    p++;
  }
  memcpy(p, status_string.c_str(), status_string_length);
  result->push_back(Slice(status_slice, Slice::STEAL_REF));
}

}  // namespace gateway
}  // namespace grpc
