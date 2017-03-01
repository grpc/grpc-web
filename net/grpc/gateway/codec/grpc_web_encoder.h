#ifndef NET_GRPC_GATEWAY_CODEC_GRPC_WEB_ENCODER_H_
#define NET_GRPC_GATEWAY_CODEC_GRPC_WEB_ENCODER_H_

#include "net/grpc/gateway/codec/encoder.h"

namespace grpc {
namespace gateway {

class GrpcWebEncoder : public Encoder {
 public:
  GrpcWebEncoder();
  virtual ~GrpcWebEncoder();

  // GrpcWebEncoder is neither copyable nor movable.
  GrpcWebEncoder(const GrpcWebEncoder&) = delete;
  GrpcWebEncoder& operator=(const GrpcWebEncoder&) = delete;

  void Encode(grpc::ByteBuffer* input, std::vector<Slice>* result) override;

  void EncodeStatus(const grpc::Status& status, const Trailers* trailers,
                    std::vector<Slice>* result) override;
};

}  // namespace gateway
}  // namespace grpc
#endif  // NET_GRPC_GATEWAY_CODEC_GRPC_WEB_ENCODER_H_
