#ifndef NET_GRPC_GATEWAY_CODEC_STREAM_BODY_ENCODER_H_
#define NET_GRPC_GATEWAY_CODEC_STREAM_BODY_ENCODER_H_

#include "net/grpc/gateway/codec/encoder.h"
#include "third_party/grpc/include/grpc++/support/byte_buffer.h"

namespace grpc {
namespace gateway {

class StreamBodyEncoder : public Encoder {
 public:
  StreamBodyEncoder();
  ~StreamBodyEncoder() override;
  StreamBodyEncoder(const StreamBodyEncoder&) = delete;
  StreamBodyEncoder& operator=(const StreamBodyEncoder&) = delete;

  void Encode(grpc::ByteBuffer* input, std::vector<Slice>* result) override;
  void EncodeStatus(const grpc::Status& status, const Trailers* trailers,
                    std::vector<Slice>* result) override;
};

}  // namespace gateway
}  // namespace grpc
#endif  // NET_GRPC_GATEWAY_CODEC_STREAM_BODY_ENCODER_H_
