#ifndef NET_GRPC_GATEWAY_CODEC_ENCODER_H_
#define NET_GRPC_GATEWAY_CODEC_ENCODER_H_

#include "net/grpc/gateway/runtime/types.h"
#include "third_party/grpc/include/grpc++/support/byte_buffer.h"

namespace grpc {
namespace gateway {

// Interface for GRPC-Gateway encoders. A encoder instance records the internal
// states during the processing of a response (stream). Encoder encodes the GRPC
// response to different front end protocols.
class Encoder {
 public:
  Encoder();
  virtual ~Encoder();
  Encoder(const Encoder&) = delete;
  Encoder& operator=(const Encoder&) = delete;

  // Encodes a GRPC response message to the front end protocol.
  virtual void Encode(grpc::ByteBuffer* input, std::vector<Slice>* result) = 0;

  // Encodes a GRPC response status to the front end protocol.
  virtual void EncodeStatus(const grpc::Status& status,
                            std::vector<Slice>* result);

  // Encodes a GRPC response status and trailers to the frontend protocol.
  virtual void EncodeStatus(const grpc::Status& status,
                            const Trailers* trailers,
                            std::vector<Slice>* result) = 0;
};

}  // namespace gateway
}  // namespace grpc
#endif  // NET_GRPC_GATEWAY_CODEC_ENCODER_H_
