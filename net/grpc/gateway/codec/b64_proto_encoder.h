#ifndef NET_GRPC_GATEWAY_CODEC_B64_PROTO_ENCODER_H_
#define NET_GRPC_GATEWAY_CODEC_B64_PROTO_ENCODER_H_

#include "net/grpc/gateway/codec/base64.h"
#include "net/grpc/gateway/codec/proto_encoder.h"

namespace grpc {
namespace gateway {

class B64ProtoEncoder : public ProtoEncoder {
 public:
  B64ProtoEncoder();
  ~B64ProtoEncoder() override;

  // B64ProtoEncoder is neither copyable nor movable.
  B64ProtoEncoder(const B64ProtoEncoder&) = delete;
  B64ProtoEncoder& operator=(const B64ProtoEncoder&) = delete;

  void Encode(grpc::ByteBuffer* input, std::vector<Slice>* result) override;
  void EncodeStatus(const grpc::Status& status, const Trailers* trailers,
                    std::vector<Slice>* result) override;

 private:
  Base64 base64_;
};

}  // namespace gateway
}  // namespace grpc
#endif  // NET_GRPC_GATEWAY_CODEC_B64_PROTO_ENCODER_H_
