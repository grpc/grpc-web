#ifndef NET_GRPC_GATEWAY_CODEC_PROTO_ENCODER_H_
#define NET_GRPC_GATEWAY_CODEC_PROTO_ENCODER_H_

#include "net/grpc/gateway/codec/encoder.h"

namespace grpc {
namespace gateway {

class ProtoEncoder : public Encoder {
 public:
  ProtoEncoder();
  ~ProtoEncoder() override;

  // ProtoEncoder is neither copyable nor movable.
  ProtoEncoder(const ProtoEncoder&) = delete;
  ProtoEncoder& operator=(const ProtoEncoder&) = delete;

  void Encode(grpc::ByteBuffer* input, std::vector<Slice>* result) override;

  void EncodeStatus(const grpc::Status& status, const Trailers* trailers,
                    std::vector<Slice>* result) override;
};

}  // namespace gateway
}  // namespace grpc
#endif  // NET_GRPC_GATEWAY_CODEC_PROTO_ENCODER_H_
