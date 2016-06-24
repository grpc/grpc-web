#ifndef NET_GRPC_GATEWAY_CODEC_JSON_ENCODER_H_
#define NET_GRPC_GATEWAY_CODEC_JSON_ENCODER_H_

#include <vector>

#include "net/grpc/gateway/codec/base64.h"
#include "net/grpc/gateway/codec/encoder.h"
#include "third_party/grpc/include/grpc++/support/byte_buffer.h"
#include "third_party/grpc/include/grpc++/support/slice.h"

namespace grpc {
namespace gateway {

class JsonEncoder : public Encoder {
 public:
  JsonEncoder();
  ~JsonEncoder() override;
  JsonEncoder(const JsonEncoder&) = delete;
  JsonEncoder& operator=(const JsonEncoder&) = delete;

  void Encode(grpc::ByteBuffer* input, std::vector<Slice>* result) override;
  void EncodeStatus(const grpc::Status& status, const Trailers& trailers,
                    std::vector<Slice>* result) override;

 private:
  bool is_first_message_;
  Base64 base64_;
};

}  // namespace gateway
}  // namespace grpc
#endif  // NET_GRPC_GATEWAY_CODEC_JSON_ENCODER_H_
