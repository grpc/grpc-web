#ifndef NET_GRPC_GATEWAY_CODEC_GRPC_WEB_TEXT_DECODER_H_
#define NET_GRPC_GATEWAY_CODEC_GRPC_WEB_TEXT_DECODER_H_

#include "net/grpc/gateway/codec/base64.h"
#include "net/grpc/gateway/codec/grpc_web_decoder.h"

namespace grpc {
namespace gateway {

class GrpcWebTextDecoder : public GrpcWebDecoder {
 public:
  GrpcWebTextDecoder();
  ~GrpcWebTextDecoder() override;
  GrpcWebTextDecoder(const GrpcWebTextDecoder&) = delete;
  GrpcWebTextDecoder& operator=(const GrpcWebTextDecoder&) = delete;

  Status Decode() override;

 private:
  Base64 base64_;
};

}  // namespace gateway
}  // namespace grpc

#endif  // NET_GRPC_GATEWAY_CODEC_GRPC_WEB_TEXT_DECODER_H_
