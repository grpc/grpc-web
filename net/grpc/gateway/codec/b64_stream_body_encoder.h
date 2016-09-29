#ifndef NET_GRPC_GATEWAY_CODEC_B64_STREAM_BODY_ENCODER_H_
#define NET_GRPC_GATEWAY_CODEC_B64_STREAM_BODY_ENCODER_H_

#include <vector>

#include "net/grpc/gateway/codec/base64.h"
#include "net/grpc/gateway/codec/stream_body_encoder.h"
#include "net/grpc/gateway/runtime/types.h"
#include "third_party/grpc/include/grpc++/support/byte_buffer.h"
#include "third_party/grpc/include/grpc++/support/slice.h"
#include "third_party/grpc/include/grpc++/support/status.h"

namespace grpc {
namespace gateway {

class B64StreamBodyEncoder : public StreamBodyEncoder {
 public:
  B64StreamBodyEncoder();
  ~B64StreamBodyEncoder() override;
  B64StreamBodyEncoder(const B64StreamBodyEncoder&) = delete;
  B64StreamBodyEncoder& operator=(const B64StreamBodyEncoder&) = delete;

  void Encode(grpc::ByteBuffer* input, std::vector<Slice>* result) override;
  void EncodeStatus(const grpc::Status& status, const Trailers* trailers,
                    std::vector<Slice>* result) override;

 private:
  Base64 base64_;
};

}  // namespace gateway
}  // namespace grpc
#endif  // NET_GRPC_GATEWAY_CODEC_B64_STREAM_BODY_ENCODER_H_
