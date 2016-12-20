#ifndef NET_GRPC_GATEWAY_CODEC_BASE64_H_
#define NET_GRPC_GATEWAY_CODEC_BASE64_H_

#include <stddef.h>
#include <cstdint>
#include <memory>
#include <vector>

#include "third_party/grpc/include/grpc++/support/slice.h"

namespace grpc {
namespace gateway {

class Base64 {
 public:
  // Returns true if the given character is a valid base64 character, includes
  // padding.
  static bool IsBase64Char(uint8_t c);

  Base64();
  virtual ~Base64();
  Base64(const Base64&) = delete;
  Base64& operator=(const Base64&) = delete;

  // Encodes the input to base64 encoding, returns true if success.
  bool Encode(const std::vector<Slice>& input, std::vector<Slice>* output);

  // Decodes the base64 encoded input, returns true if decode success.
  bool Decode(const std::vector<Slice>& input, std::vector<Slice>* output);

 private:
  // Encodes once single slice together with the data remain in last slice to
  // base64. Remained data which cannot be encoded will be put back to the
  // buffer. Padding applied when the input slice is the last one.
  std::unique_ptr<Slice> Encode(const Slice& input, uint8_t* buffer,
                                size_t* buffer_length, bool is_last);

  void Encode1CharGroup(uint8_t input_0, uint8_t* output);
  void Encode2CharGroup(uint8_t input_0, uint8_t input_1, uint8_t* output);
  void Encode3CharGroup(uint8_t input_0, uint8_t input_1, uint8_t input_2,
                        uint8_t* output);

  // Decodes a base64 group. The input must be a pointer to uint8_t array with
  // at least 4 elements. The output must be a pointer to uint8_t array with
  // at least 3 elements. Returns the decoded data size if decode success, else
  // returns -1.
  int DecodeGroup(const uint8_t* input, uint8_t* output);

  uint8_t decode_buffer_[4];
  size_t decode_buffer_length_;
};

}  // namespace gateway
}  // namespace grpc
#endif  // NET_GRPC_GATEWAY_CODEC_BASE64_H_
