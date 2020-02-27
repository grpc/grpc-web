package com.google.grpcweb;

import java.io.IOException;
import javax.servlet.ServletOutputStream;
import javax.servlet.http.HttpServletResponse;

class SendResponse {
  /**
   * Write response out.
   */
  void writeResponse(HttpServletResponse response, byte[] out) throws IOException {
    ServletOutputStream oStream = response.getOutputStream();
    oStream.write((byte) 0x00);
    oStream.write(lengthToBytes(out.length));
    oStream.write(out);
  }

  private byte[] lengthToBytes(int len) {
    return new byte[] {
        (byte) ((len >> 24) & 0xff),
        (byte) ((len >> 16) & 0xff),
        (byte) ((len >> 8) & 0xff),
        (byte) ((len >> 0) & 0xff),
    };
  }
}
