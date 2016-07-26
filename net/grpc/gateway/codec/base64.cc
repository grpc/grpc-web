#include "net/grpc/gateway/codec/base64.h"

#include <stdint.h>
#include <cstring>

#define GRPC_BASE64_PAD_CHAR '='

namespace grpc {
namespace gateway {
namespace {
const int8_t base64_bytes[] = {
    -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,
    -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,
    -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,
    -1,   -1,   -1,   -1,   -1,   -1,   -1,   0x3E, -1,   -1,   -1,   0x3F,
    0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x3B, 0x3C, 0x3D, -1,   -1,
    -1,   0x7F, -1,   -1,   -1,   0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06,
    0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F, 0x10, 0x11, 0x12,
    0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19, -1,   -1,   -1,   -1,   -1,
    -1,   0x1A, 0x1B, 0x1C, 0x1D, 0x1E, 0x1F, 0x20, 0x21, 0x22, 0x23, 0x24,
    0x25, 0x26, 0x27, 0x28, 0x29, 0x2A, 0x2B, 0x2C, 0x2D, 0x2E, 0x2F, 0x30,
    0x31, 0x32, 0x33, -1,   -1,   -1,   -1,   -1};

const char base64_url_unsafe_chars[] =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
}  // namespace

bool IsBase64Char(char c) {
  return (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') ||
         (c >= '0' && c <= '9') || c == '+' || c == '/' || c == '=';
}

bool IsSafeBase64Char(char c) {
  return (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') ||
         (c >= '0' && c <= '9') || c == '-' || c == '_' || c == '=';
}

Base64::Base64() : decode_buffer_{0}, decode_buffer_length_(0) {}

Base64::~Base64() {}

std::unique_ptr<Slice> Base64::Encode(const Slice& input, uint8_t* buffer,
                                      size_t* buffer_length, bool is_last) {
  size_t data_size = *buffer_length + input.size();
  size_t encoded_size = data_size / 3 * 4;
  size_t tail_size = data_size % 3;
  if (is_last && tail_size > 0) {
    encoded_size += 4;
  }

  if (encoded_size == 0) {
    if (input.size() > 0) {
      memcpy(buffer + *buffer_length, input.begin(), input.size());
      *buffer_length += input.size();
    }
    return nullptr;
  }

  gpr_slice output_slice = gpr_slice_malloc(encoded_size);
  uint8_t* output_ptr = GPR_SLICE_START_PTR(output_slice);

  // Encodes the first group, together with the buffer.
  const uint8_t* input_ptr = input.begin();
  if (*buffer_length == 1) {
    *output_ptr++ = base64_url_unsafe_chars[(buffer[0] >> 2) & 0x3F];
    *output_ptr++ = base64_url_unsafe_chars[((buffer[0] & 0x03) << 4) |
                                            (((*input_ptr) >> 4) & 0x0F)];
    *output_ptr++ = base64_url_unsafe_chars[(((*input_ptr) & 0x0F) << 2) |
                                            ((*(input_ptr + 1) >> 6) & 0x03)];
    *output_ptr++ = base64_url_unsafe_chars[*(input_ptr + 1) & 0x3F];
    input_ptr += 2;
  } else if (*buffer_length == 2) {
    *output_ptr++ = base64_url_unsafe_chars[(buffer[0] >> 2) & 0x3F];
    *output_ptr++ = base64_url_unsafe_chars[((buffer[0] & 0x03) << 4) |
                                            ((buffer[1] >> 4) & 0x0F)];
    *output_ptr++ = base64_url_unsafe_chars[((buffer[1] & 0x0F) << 2) |
                                            (((*input_ptr) >> 6) & 0x03)];
    *output_ptr++ = base64_url_unsafe_chars[(*input_ptr) & 0x3F];
    input_ptr += 1;
  }

  // Encodes the other groups, besides the tail.
  while (input_ptr < input.end() - tail_size) {
    *output_ptr++ = base64_url_unsafe_chars[((*input_ptr) >> 2) & 0x3F];
    *output_ptr++ = base64_url_unsafe_chars[(((*input_ptr) & 0x03) << 4) |
                                            ((*(input_ptr + 1) >> 4) & 0x0F)];
    *output_ptr++ = base64_url_unsafe_chars[((*(input_ptr + 1) & 0x0F) << 2) |
                                            ((*(input_ptr + 2) >> 6) & 0x03)];
    *output_ptr++ = base64_url_unsafe_chars[*(input_ptr + 2) & 0x3F];
    input_ptr += 3;
  }

  // Encodes the tail group if current slice is the last one.
  if (tail_size > 0) {
    if (is_last) {
      if (tail_size == 2) {
        *output_ptr++ = base64_url_unsafe_chars[((*input_ptr) >> 2) & 0x3F];
        *output_ptr++ =
            base64_url_unsafe_chars[(((*input_ptr) & 0x03) << 4) |
                                    ((*(input_ptr + 1) >> 4) & 0x0F)];
        *output_ptr++ = base64_url_unsafe_chars[(*(input_ptr + 1) & 0x0F) << 2];
        *output_ptr++ = GRPC_BASE64_PAD_CHAR;
      } else if (tail_size == 1) {
        *output_ptr++ = base64_url_unsafe_chars[(*input_ptr >> 2) & 0x3F];
        *output_ptr++ = base64_url_unsafe_chars[(*input_ptr & 0x03) << 4];
        *output_ptr++ = GRPC_BASE64_PAD_CHAR;
        *output_ptr++ = GRPC_BASE64_PAD_CHAR;
      }
      *buffer_length = 0;
    } else {
      memcpy(buffer, input_ptr, tail_size);
      *buffer_length = tail_size;
    }
  } else {
    *buffer_length = 0;
  }
  return std::unique_ptr<Slice>(new Slice(output_slice, Slice::STEAL_REF));
}

bool Base64::Encode(const std::vector<Slice>& input,
                    std::vector<Slice>* output) {
  uint8_t buffer[2] = {0};
  size_t buffer_length = 0;
  for (size_t i = 0; i < input.size(); i++) {
    std::unique_ptr<Slice> encoded_slice =
        Encode(input[i], buffer, &buffer_length, (i == input.size() - 1));
    if (encoded_slice) {
      output->push_back(*encoded_slice.release());
    }
  }
  return true;
}

bool Base64::Decode(const std::vector<Slice>& input,
                    std::vector<Slice>* output) {
  for (const Slice& slice_in : input) {
    size_t base64_length = slice_in.size() + decode_buffer_length_;
    size_t binary_length = base64_length / 4 * 3;
    size_t base64_leftover_length = base64_length % 4;

    if (base64_length < 4) {
      // No enough data to decode, copy everything to decode buffer.
      if (slice_in.size() > 0) {
        memcpy(decode_buffer_ + decode_buffer_length_, slice_in.begin(),
               slice_in.size());
        decode_buffer_length_ += slice_in.size();
      }
      continue;
    }

    gpr_slice slice_out = gpr_slice_malloc(binary_length);
    uint8_t* result_offset = GPR_SLICE_START_PTR(slice_out);

    if (decode_buffer_length_ > 0) {
      // Decode the leftover.
      uint32_t leftover = 0;
      for (int i = 0; i < decode_buffer_length_; i++) {
        leftover |= static_cast<uint32_t>(base64_bytes[decode_buffer_[i]])
                    << (3 - i) * 6;
      }
      for (int i = 0; i < 4 - decode_buffer_length_; i++) {
        leftover |= static_cast<uint32_t>(base64_bytes[*(slice_in.begin() + i)])
                    << (3 - decode_buffer_length_ - i) * 6;
      }
      *result_offset = (unsigned char)(leftover >> 16);
      result_offset++;
      *result_offset = (unsigned char)(leftover >> 8);
      result_offset++;
      *result_offset = (unsigned char)(leftover);
      result_offset++;
    }

    size_t i = (4 - decode_buffer_length_) % 4;
    while (i < slice_in.size() - base64_leftover_length) {
      if ((*(slice_in.begin() + i + 3)) == '=') {
        binary_length--;
      }
      if ((*(slice_in.begin() + i + 2)) == '=') {
        binary_length--;
      }

      uint32_t packed =
          ((uint32_t)base64_bytes[(*(slice_in.begin() + i))] << 18) |
          ((uint32_t)base64_bytes[(*(slice_in.begin() + i + 1))] << 12) |
          ((uint32_t)base64_bytes[(*(slice_in.begin() + i + 2))] << 6) |
          ((uint32_t)base64_bytes[(*(slice_in.begin() + i + 3))]);
      *result_offset = (unsigned char)(packed >> 16);
      result_offset++;
      *result_offset = (unsigned char)(packed >> 8);
      result_offset++;
      *result_offset = (unsigned char)(packed);
      result_offset++;
      i += 4;
    }
    GPR_SLICE_SET_LENGTH(slice_out, binary_length);
    output->push_back(Slice(slice_out, Slice::STEAL_REF));

    if (base64_leftover_length > 0) {
      memcpy(decode_buffer_, slice_in.end() - base64_leftover_length,
             base64_leftover_length);
    }
    decode_buffer_length_ = base64_leftover_length;
  }

  if (output->empty()) {
    output->push_back(Slice(gpr_empty_slice(), Slice::STEAL_REF));
  }
  return true;
}

}  // namespace gateway
}  // namespace grpc
