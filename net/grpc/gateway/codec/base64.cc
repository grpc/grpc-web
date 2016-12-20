#include "net/grpc/gateway/codec/base64.h"

#include <stdint.h>
#include <cstring>

namespace grpc {
namespace gateway {
namespace {

const char kPad = '=';

// Map from base64 encoded char to raw byte.
const int32_t b64_bytes[] = {
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
    0x31, 0x32, 0x33, -1,   -1,   -1,   -1,   -1,   -1,   -1,    // 120 - 129
    -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,    // 130 - 139
    -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,    // 140 - 149
    -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,    // 150 - 159
    -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,    // 160 - 169
    -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,    // 170 - 179
    -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,    // 180 - 189
    -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,    // 190 - 199
    -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,    // 200 - 209
    -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,    // 210 - 219
    -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,    // 220 - 229
    -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,    // 230 - 239
    -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,    // 240 - 249
    -1,   -1,   -1,   -1,   -1,   -1,                            // 250 - 255
};

const char b64_chars[] =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
}  // namespace

bool Base64::IsBase64Char(uint8_t c) { return b64_bytes[c] != -1; }

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
  const uint8_t* input = input_slice.begin();

  // trailers only.
  if (data_size == 1) {
    if (*buffer_length == 0) {
      Encode1CharGroup(*input, output);
    } else {
      Encode1CharGroup(buffer[0], output);
    }
    *buffer_length = 0;
  } else if (data_size == 2) {
    if (*buffer_length == 0) {
      Encode2CharGroup(*input, *(input + 1), output);
    } else if (*buffer_length == 1) {
      Encode2CharGroup(buffer[0], *input, output);
    } else if (*buffer_length == 2) {
      Encode2CharGroup(buffer[0], buffer[1], output);
    }
    *buffer_length = 0;
  } else if (data_size > 2) {
    // Encodes the first group, together with the buffer.
    if (*buffer_length == 1) {
      Encode3CharGroup(buffer[0], *input, *(input + 1), output);
      output += 4;
      input += 2;
    } else if (*buffer_length == 2) {
      Encode3CharGroup(buffer[0], buffer[1], *input, output);
      output += 4;
      input += 1;
    }
    // Encodes the other groups, besides the tail.
    while (input < input_slice.end() - tail_size) {
      Encode3CharGroup(*input, *(input + 1), *(input + 2), output);
      output += 4;
      input += 3;
    }
    // Encodes the tail group if current slice is the last one.
    if (tail_size > 0) {
      if (is_last) {
        if (tail_size == 2) {
          Encode2CharGroup(*input, *(input + 1), output);
        } else if (tail_size == 1) {
          Encode1CharGroup(*input, output);
        }
        *buffer_length = 0;
      } else {
        memcpy(buffer, input, tail_size);
        *buffer_length = tail_size;
      }
    } else {
      *buffer_length = 0;
    }
  }
  return std::unique_ptr<Slice>(new Slice(output_slice, Slice::STEAL_REF));
}

void Base64::Encode1CharGroup(uint8_t input_0, uint8_t* output) {
  *output++ = b64_chars[(input_0 >> 2) & 0x3F];
  *output++ = b64_chars[(input_0 & 0x03) << 4];
  *output++ = kPad;
  *output++ = kPad;
}
void Base64::Encode2CharGroup(uint8_t input_0, uint8_t input_1,
                              uint8_t* output) {
  *output++ = b64_chars[(input_0 >> 2) & 0x3F];
  *output++ = b64_chars[((input_0 & 0x03) << 4) | ((input_1 >> 4) & 0x0F)];
  *output++ = b64_chars[(input_1 & 0x0F) << 2];
  *output++ = kPad;
}
void Base64::Encode3CharGroup(uint8_t input_0, uint8_t input_1, uint8_t input_2,
                              uint8_t* output) {
  *output++ = b64_chars[(input_0 >> 2) & 0x3F];
  *output++ = b64_chars[((input_0 & 0x03) << 4) | ((input_1 >> 4) & 0x0F)];
  *output++ = b64_chars[((input_1 & 0x0F) << 2) | ((input_2 >> 6) & 0x03)];
  *output++ = b64_chars[input_2 & 0x3F];
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
      // No enough data to form a group for decoding, copy everything to decode
      // buffer.
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
      memcpy(decode_buffer_ + decode_buffer_length_, slice_in.begin(),
             4 - decode_buffer_length_);
      int size = DecodeGroup(decode_buffer_, result_offset);
      if (size == -1) {
        return false;
      }
      result_offset += size;
      if (size != 3) {
        binary_length -= (3 - size);
      }
    }

    for (size_t i = (4 - decode_buffer_length_) % 4;
         i < slice_in.size() - base64_leftover_length; i = i + 4) {
      int size = DecodeGroup(slice_in.begin() + i, result_offset);
      if (size == -1) {
        return false;
      }
      result_offset += size;
      if (size != 3) {
        binary_length -= (3 - size);
      }
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

int Base64::DecodeGroup(const uint8_t* input, uint8_t* output) {
  int size = 3;
  uint8_t byte0 = *input;
  uint8_t byte1 = *(input + 1);
  uint8_t byte2 = *(input + 2);
  uint8_t byte3 = *(input + 3);
  uint32_t packed = b64_bytes[byte0] << 18 | b64_bytes[byte1] << 12 |
                    b64_bytes[byte2] << 6 | b64_bytes[byte3];

  if ((packed & 0xFF000000) != 0 || byte0 == kPad || byte1 == kPad ||
      (byte2 == kPad && byte3 != kPad)) {
    return -1;
  }
  if (byte2 == kPad) {
    size--;
  }
  if (byte3 == kPad) {
    size--;
  }

  *output++ = static_cast<uint8_t>(packed >> 16);
  *output++ = static_cast<uint8_t>(packed >> 8);
  *output++ = static_cast<uint8_t>(packed);
  return size;
}
}  // namespace gateway
}  // namespace grpc
