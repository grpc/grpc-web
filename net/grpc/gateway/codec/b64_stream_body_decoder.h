#ifndef NET_GRPC_GATEWAY_CODEC_B64_STREAM_BODY_DECODER_H_
#define NET_GRPC_GATEWAY_CODEC_B64_STREAM_BODY_DECODER_H_

#include "net/grpc/gateway/codec/base64.h"
#include "net/grpc/gateway/codec/stream_body_decoder.h"
#include "third_party/grpc/include/grpc++/support/status.h"

namespace grpc {
namespace gateway {

class B64StreamBodyDecoder : public StreamBodyDecoder {
 public:
  B64StreamBodyDecoder();
  ~B64StreamBodyDecoder() override;
  B64StreamBodyDecoder(const B64StreamBodyDecoder&) = delete;
  B64StreamBodyDecoder& operator=(const B64StreamBodyDecoder&) = delete;

  Status Decode() override;

 private:
  Base64 base64_;
};

}  // namespace gateway
}  // namespace grpc
#endif  // NET_GRPC_GATEWAY_CODEC_B64_STREAM_BODY_DECODER_H_
