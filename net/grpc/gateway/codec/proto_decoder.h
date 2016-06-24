#ifndef NET_GRPC_GATEWAY_CODEC_PROTO_DECODER_H_
#define NET_GRPC_GATEWAY_CODEC_PROTO_DECODER_H_

#include <memory>
#include <vector>

#include "net/grpc/gateway/codec/decoder.h"
#include "third_party/grpc/include/grpc++/support/byte_buffer.h"
#include "third_party/grpc/include/grpc++/support/slice.h"

namespace grpc {
namespace gateway {

class ProtoDecoder : public Decoder {
 public:
  enum State {
    // The initial decode state.
    EXPECTING_MESSAGE_KEY_TYPE,
    // The key and type of a proto field has been read.
    EXPECTING_MESSAGE_VARINT_LENGTH,
    // The length of a proto field has been read.
    EXPECTING_MESSAGE_DATA
  };

  ProtoDecoder();
  ~ProtoDecoder() override;
  ProtoDecoder(const ProtoDecoder&) = delete;
  ProtoDecoder& operator=(const ProtoDecoder&) = delete;

  Status Decode() override;

 private:
  State state_;
  size_t varint_value_;
  size_t varint_bytes_;
  std::unique_ptr<Slice> buffer_;
};

}  // namespace gateway
}  // namespace grpc
#endif  // NET_GRPC_GATEWAY_CODEC_PROTO_DECODER_H_
