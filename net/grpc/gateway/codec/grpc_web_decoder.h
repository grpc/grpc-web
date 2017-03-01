#ifndef NET_GRPC_GATEWAY_CODEC_GRPC_WEB_DECODER_H_
#define NET_GRPC_GATEWAY_CODEC_GRPC_WEB_DECODER_H_

#include <cstdint>
#include <memory>

#include "net/grpc/gateway/codec/decoder.h"
#include "third_party/grpc/include/grpc++/support/slice.h"

namespace grpc {
namespace gateway {

class GrpcWebDecoder : public Decoder {
 public:
  static const uint8_t kGrpcWebMessage;

  enum State : uint8_t {
    // The initial decode state, expecting the flags (1 byte).
    kExpectingFlags,
    // Expecting the 1st byte of message length (4 bytes in total).
    kExpectingMessageLengthByte0,
    // Expecting the 2nd byte of message length (4 bytes in total).
    kExpectingMessageLengthByte1,
    // Expecting the 3rd byte of message length (4 bytes in total).
    kExpectingMessageLengthByte2,
    // Expecting the 4th byte of message length (4 bytes in total).
    kExpectingMessageLengthByte3,
    // Expecting the message data.
    kExpectingMessageData
  };

  GrpcWebDecoder();
  virtual ~GrpcWebDecoder();

  // GrpcWebDecoder is neither copyable nor movable.
  GrpcWebDecoder(const GrpcWebDecoder&) = delete;
  GrpcWebDecoder& operator=(const GrpcWebDecoder&) = delete;

  Status Decode() override;

 private:
  State state_;
  // The message length of the current decoding GRPC-Web frame.
  uint32_t message_length_;
  // The data buffered for the current decoding GRPC-Web frame.
  std::unique_ptr<Slice> buffer_;
};

}  // namespace gateway
}  // namespace grpc
#endif  // NET_GRPC_GATEWAY_CODEC_GRPC_WEB_DECODER_H_
