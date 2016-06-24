#ifndef NET_GRPC_GATEWAY_CODEC_JSON_DECODER_H_
#define NET_GRPC_GATEWAY_CODEC_JSON_DECODER_H_

#include <memory>
#include <vector>

#include "net/grpc/gateway/codec/base64.h"
#include "net/grpc/gateway/codec/decoder.h"
#include "third_party/grpc/include/grpc++/support/byte_buffer.h"
#include "third_party/grpc/include/grpc++/support/slice.h"

namespace grpc {
namespace gateway {

class JsonDecoder : public Decoder {
 public:
  enum State {
    EXPECTING_JSON_ARRAY_LEFT_BRACKET,
    EXPECTING_JSON_OBJECT_LEFT_BRACKET,
    EXPECTING_JSON_OBJECT_RIGHT_BRACKET,
    EXPECTING_JSON_OBJECT_DELIMITER_OR_JSON_ARRAY_RIGHT_BRACKET,
    EXPECTING_JSON_MESSAGE_TAG_LEFT_QUOTE,
    EXPECTING_JSON_MESSAGE_TAG,
    EXPECTING_JSON_MESSAGE_TAG_RIGHT_QUOTE,
    EXPECTING_JSON_MESSAGE_TAG_VALUE_DELIMITER,
    EXPECTING_JSON_MESSAGE_VALUE_LEFT_QUOTE,
    EXPECTING_JSON_MESSAGE_VALUE_OR_RIGHT_QUOTE,
    FINISH
  };

  JsonDecoder();
  ~JsonDecoder() override;
  JsonDecoder(const JsonDecoder&) = delete;
  JsonDecoder& operator=(const JsonDecoder&) = delete;

  Status Decode() override;

 private:
  State state_;
  std::vector<Slice> base64_buffer_;
  Base64 base64_;
};

}  // namespace gateway
}  // namespace grpc
#endif  // NET_GRPC_GATEWAY_CODEC_JSON_DECODER_H_
