package com.google.grpcweb;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import javax.servlet.ServletOutputStream;
import javax.servlet.http.HttpServletResponse;
import java.util.Base64;

class SendResponse {
  /**
   * Write response out.
   */
  static void writeResponse(HttpServletResponse response, byte[] out) throws IOException {
    // PUNT set content type to what the inomcing request had
    response.setContentType("application/grpc-web-text+proto");

    // PUNT multiple frames not handled
    byte[] prefix = new MessageFramer().getPrefix(out);

    // PUNT not efficient. combine 2 byte arrays
    byte[] concated = new byte[out.length + 5];
    System.arraycopy(prefix, 0, concated, 0, 5);
    System.arraycopy(out, 0, concated , 5, out.length);

    // PUNT binary encode only for certain content type
    byte[] encoded = Base64.getEncoder().encode(concated);

    ServletOutputStream oStream = response.getOutputStream();
    oStream.write(encoded);
  }
}
