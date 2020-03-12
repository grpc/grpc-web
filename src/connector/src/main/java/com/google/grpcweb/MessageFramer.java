package com.google.grpcweb;

/**
 * Creates frames from the input bytes.
 */
class MessageFramer {
  static final byte DATA_BYTE = (byte) 0x00;

  // TODO: handle more than single frame; i.e., input byte array size > (2GB - 1)
  byte[] getPrefix(byte[] in) {
    int len = in.length;
    return new byte[] {
        DATA_BYTE,
        (byte) ((len >> 24) & 0xff),
        (byte) ((len >> 16) & 0xff),
        (byte) ((len >> 8) & 0xff),
        (byte) ((len >> 0) & 0xff),
    };
  }
}
