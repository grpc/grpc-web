#ifndef NET_GRPC_GATEWAY_CODEC_STREAM_BODY_DECODER_H_
#define NET_GRPC_GATEWAY_CODEC_STREAM_BODY_DECODER_H_

#include <memory>
#include <vector>

#include "net/grpc/gateway/codec/decoder.h"
#include "third_party/grpc/include/grpc++/support/byte_buffer.h"
#include "third_party/grpc/include/grpc++/support/slice.h"

namespace grpc {
namespace gateway {

class StreamBodyDecoder : public Decoder {
 public:
  enum State {
    // The initial decode state.
    EXPECTING_MESSAGE_KEY_TYPE,
    // The key and type of a proto field has been read.
    EXPECTING_MESSAGE_VARINT_LENGTH,
    // The length of a proto field has been read.
    EXPECTING_MESSAGE_DATA
  };

  StreamBodyDecoder();
  ~StreamBodyDecoder() override;
  StreamBodyDecoder(const StreamBodyDecoder&) = delete;
  StreamBodyDecoder& operator=(const StreamBodyDecoder&) = delete;

  Status Decode() override;

 private:
  State state_;
  size_t varint_value_;
  size_t varint_bytes_;
  std::unique_ptr<Slice> buffer_;
};

}  // namespace gateway
}  // namespace grpc
#endif  // NET_GRPC_GATEWAY_CODEC_STREAM_BODY_DECODER_H_
