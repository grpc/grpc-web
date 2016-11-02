#ifndef NET_GRPC_GATEWAY_CODEC_B64_PROTO_DECODER_H_
#define NET_GRPC_GATEWAY_CODEC_B64_PROTO_DECODER_H_

#include "net/grpc/gateway/codec/base64.h"
#include "net/grpc/gateway/codec/proto_decoder.h"
#include "third_party/grpc/include/grpc++/support/status.h"

namespace grpc {
namespace gateway {

class B64ProtoDecoder : public ProtoDecoder {
 public:
  B64ProtoDecoder();
  ~B64ProtoDecoder() override;
  B64ProtoDecoder(const B64ProtoDecoder&) = delete;
  B64ProtoDecoder& operator=(const B64ProtoDecoder&) = delete;

  Status Decode() override;

 private:
  Base64 base64_;
};

}  // namespace gateway
}  // namespace grpc
#endif  // NET_GRPC_GATEWAY_CODEC_B64_PROTO_DECODER_H_
