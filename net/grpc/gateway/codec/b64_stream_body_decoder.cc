#include "net/grpc/gateway/codec/b64_stream_body_decoder.h"

#include <vector>

#include "net/grpc/gateway/codec/decoder.h"
#include "third_party/grpc/include/grpc++/support/slice.h"
#include "third_party/grpc/include/grpc++/support/status.h"

namespace grpc {
namespace gateway {

B64StreamBodyDecoder::B64StreamBodyDecoder() {}

B64StreamBodyDecoder::~B64StreamBodyDecoder() {}

Status B64StreamBodyDecoder::Decode() {
  vector<Slice> buffer;
  if (!base64_.Decode(*inputs(), &buffer)) {
    return Status(StatusCode::INVALID_ARGUMENT, "Invalid base64 inputs.");
  }

  inputs()->clear();
  for (Slice& s : buffer) {
    Append(s);
  }

  return StreamBodyDecoder::Decode();
}

}  // namespace gateway
}  // namespace grpc
