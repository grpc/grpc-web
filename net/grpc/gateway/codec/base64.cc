#include "net/grpc/gateway/codec/base64.h"

#include <stdint.h>
#include <cstring>

#define PAD '='

namespace grpc {
namespace gateway {
namespace {

// Map from base64 encoded char to raw byte.
const int8_t b64_bytes[] = {
    -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,    //   0 -   9
    -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,    //  10 -  19
    -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,    //  20 -  29
    -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,    //  30 -  39
    -1,   -1,   -1,   0x3E, -1,   -1,   -1,   0x3F, 0x34, 0x35,  //  40 -  49
    0x36, 0x37, 0x38, 0x39, 0x3A, 0x3B, 0x3C, 0x3D, -1,   -1,    //  50 -  59
    -1,   0x7F, -1,   -1,   -1,   0x00, 0x01, 0x02, 0x03, 0x04,  //  60 -  69
    0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E,  //  70 -  79
    0x0F, 0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18,  //  80 -  89
    0x19, -1,   -1,   -1,   -1,   -1,   -1,   0x1A, 0x1B, 0x1C,  //  90 -  99
    0x1D, 0x1E, 0x1F, 0x20, 0x21, 0x22, 0x23, 0x24, 0x25, 0x26,  // 100 - 109
    0x27, 0x28, 0x29, 0x2A, 0x2B, 0x2C, 0x2D, 0x2E, 0x2F, 0x30,  // 110 - 119
    0x31, 0x32, 0x33, -1,   -1,   -1,   -1,   -1                 // 120 - 127
};

const char b64_chars[] =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
}  // namespace

bool Base64::IsBase64Char(char c) { return b64_bytes[c] != -1; }

Base64::Base64() : decode_buffer_{0}, decode_buffer_length_(0) {}

Base64::~Base64() {}

std::unique_ptr<Slice> Base64::Encode(const Slice& input_slice, uint8_t* buffer,
                                      size_t* buffer_length, bool is_last) {
  size_t data_size = *buffer_length + input_slice.size();
  size_t encoded_size = data_size / 3 * 4;
  size_t tail_size = data_size % 3;
  if (is_last && tail_size > 0) {
    encoded_size += 4;
  }

  if (encoded_size == 0) {
    if (input_slice.size() > 0) {
      memcpy(buffer + *buffer_length, input_slice.begin(), input_slice.size());
      *buffer_length += input_slice.size();
    }
    return nullptr;
  }

  gpr_slice output_slice = gpr_slice_malloc(encoded_size);
  uint8_t* output = GPR_SLICE_START_PTR(output_slice);

  // Encodes the first group, together with the buffer.
  const uint8_t* input = input_slice.begin();
  if (*buffer_length == 1) {
    *output++ = b64_chars[(buffer[0] >> 2) & 0x3F];
    *output++ = b64_chars[((buffer[0] & 0x03) << 4) | (((*input) >> 4) & 0x0F)];
    *output++ =
        b64_chars[(((*input) & 0x0F) << 2) | ((*(input + 1) >> 6) & 0x03)];
    *output++ = b64_chars[*(input + 1) & 0x3F];
    input += 2;
  } else if (*buffer_length == 2) {
    *output++ = b64_chars[(buffer[0] >> 2) & 0x3F];
    *output++ =
        b64_chars[((buffer[0] & 0x03) << 4) | ((buffer[1] >> 4) & 0x0F)];
    *output++ = b64_chars[((buffer[1] & 0x0F) << 2) | (((*input) >> 6) & 0x03)];
    *output++ = b64_chars[(*input) & 0x3F];
    input += 1;
  }

  // Encodes the other groups, besides the tail.
  while (input < input_slice.end() - tail_size) {
    *output++ = b64_chars[((*input) >> 2) & 0x3F];
    *output++ =
        b64_chars[(((*input) & 0x03) << 4) | ((*(input + 1) >> 4) & 0x0F)];
    *output++ =
        b64_chars[((*(input + 1) & 0x0F) << 2) | ((*(input + 2) >> 6) & 0x03)];
    *output++ = b64_chars[*(input + 2) & 0x3F];
    input += 3;
  }

  // Encodes the tail group if current slice is the last one.
  if (tail_size > 0) {
    if (is_last) {
      if (tail_size == 2) {
        *output++ = b64_chars[((*input) >> 2) & 0x3F];
        *output++ =
            b64_chars[(((*input) & 0x03) << 4) | ((*(input + 1) >> 4) & 0x0F)];
        *output++ = b64_chars[(*(input + 1) & 0x0F) << 2];
        *output++ = PAD;
      } else if (tail_size == 1) {
        *output++ = b64_chars[(*input >> 2) & 0x3F];
        *output++ = b64_chars[(*input & 0x03) << 4];
        *output++ = PAD;
        *output++ = PAD;
      }
      *buffer_length = 0;
    } else {
      memcpy(buffer, input, tail_size);
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
      output->push_back(*encoded_slice);
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
        leftover |= static_cast<uint32_t>(b64_bytes[decode_buffer_[i]])
                    << (3 - i) * 6;
      }
      for (int i = 0; i < 4 - decode_buffer_length_; i++) {
        leftover |= static_cast<uint32_t>(b64_bytes[*(slice_in.begin() + i)])
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
          (static_cast<uint32_t>(b64_bytes[(*(slice_in.begin() + i))]) << 18) |
          (static_cast<uint32_t>(b64_bytes[(*(slice_in.begin() + i + 1))])
           << 12) |
          (static_cast<uint32_t>(b64_bytes[(*(slice_in.begin() + i + 2))])
           << 6) |
          (static_cast<uint32_t>(b64_bytes[(*(slice_in.begin() + i + 3))]));
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
