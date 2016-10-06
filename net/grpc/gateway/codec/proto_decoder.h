#ifndef NET_GRPC_GATEWAY_CODEC_PROTO_DECODER_H_
#define NET_GRPC_GATEWAY_CODEC_PROTO_DECODER_H_

#include "net/grpc/gateway/codec/decoder.h"

namespace grpc {
namespace gateway {

class ProtoDecoder : public Decoder {
 public:
  ProtoDecoder();
  ~ProtoDecoder() override;
  ProtoDecoder(const ProtoDecoder&) = delete;
  ProtoDecoder& operator=(const ProtoDecoder&) = delete;

  Status Decode() override;
};

}  // namespace gateway
}  // namespace grpc
#endif  // NET_GRPC_GATEWAY_CODEC_PROTO_DECODER_H_
