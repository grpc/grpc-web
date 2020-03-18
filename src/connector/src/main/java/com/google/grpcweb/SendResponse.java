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
    byte[] prefix = new MessageFramer().getPrefix(out);
    oStream.write(prefix);
    oStream.write(out);
  }
}
