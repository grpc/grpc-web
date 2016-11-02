#include "net/grpc/gateway/codec/b64_stream_body_encoder.h"

namespace grpc {
namespace gateway {

B64StreamBodyEncoder::B64StreamBodyEncoder() {}

B64StreamBodyEncoder::~B64StreamBodyEncoder() {}

void B64StreamBodyEncoder::Encode(grpc::ByteBuffer* input,
                                  std::vector<Slice>* result) {
  std::vector<Slice> buffer;
  StreamBodyEncoder::Encode(input, &buffer, true);
  base64_.Encode(buffer, result);
}

void B64StreamBodyEncoder::EncodeStatus(const grpc::Status& status,
                                        const Trailers* trailers,
                                        std::vector<Slice>* result) {
  std::vector<Slice> buffer;
  StreamBodyEncoder::EncodeStatus(status, trailers, &buffer, true);
  base64_.Encode(buffer, result);
}

}  // namespace gateway
}  // namespace grpc
