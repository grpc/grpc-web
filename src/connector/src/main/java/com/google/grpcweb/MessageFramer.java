package com.google.grpcweb;

/**
 * Creates frames from the input bytes.
 */
class MessageFramer {
  enum Type {
    DATA ((byte) 0x00),
    TRAILER ((byte) 0x80);

    public final byte value;
    Type(byte b) {
      value = b;
    }
  }

  // TODO: handle more than single frame; i.e., input byte array size > (2GB - 1)
  byte[] getPrefix(byte[] in, Type type) {
    int len = in.length;
    return new byte[] {
        type.value,
        (byte) ((len >> 24) & 0xff),
        (byte) ((len >> 16) & 0xff),
        (byte) ((len >> 8) & 0xff),
        (byte) ((len >> 0) & 0xff),
    };
  }
}
