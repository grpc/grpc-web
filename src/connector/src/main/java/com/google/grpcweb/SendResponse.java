package com.google.grpcweb;

import com.google.grpcweb.MessageHandler.ContentType;
import io.grpc.Status;
import java.io.IOException;
import java.util.logging.Logger;
import javax.servlet.ServletOutputStream;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.Base64;

class SendResponse {
  private static final Logger LOG = Logger.getLogger(SendResponse.class.getName());

  private final String mContentType;
  private final HttpServletResponse mResp;

  SendResponse(HttpServletRequest req, HttpServletResponse resp) {
    mContentType = req.getContentType();
    mResp = resp;
  }
  /**
   * Write response out.
   */
  void writeResponse(byte[] out) {
    setHeaders();
    writeResponse(out, MessageFramer.Type.DATA);
  }

  void returnUnimplementedStatusCode() {
    setHeaders();
    writeGrpcStatusTrailer(Status.UNIMPLEMENTED);
    writeOk();
  }

  void writeOk() {
    mResp.setStatus(HttpServletResponse.SC_OK);
  }

  private void setHeaders() {
    mResp.setContentType(mContentType);
    mResp.setHeader("transfer-encoding", "chunked");
    mResp.setHeader("trailer", "grpc-status,grpc-message");
  }

  void writeError(Status s) {
    setHeaders();
    writeGrpcStatusTrailer(s);
    writeOk();
  }

  void writeGrpcStatusTrailer(Status status) {
    String trailer = String.format("grpc-status:%d\r\ngrpc-message:%s\r\n",
        status.getCode().value(), status.getDescription());
    writeResponse(trailer.getBytes(), MessageFramer.Type.TRAILER);
  }

  private void writeResponse(byte[] out, MessageFramer.Type type) {
    try {
      // PUNT multiple frames not handled
      byte[] prefix = new MessageFramer().getPrefix(out, type);
      ServletOutputStream oStream = mResp.getOutputStream();
      // binary encode if it is "text" content type
      if (MessageHandler.getContentType(mContentType) == ContentType.GRPC_WEB_TEXT) {
        byte[] concated = new byte[out.length + 5];
        System.arraycopy(prefix, 0, concated, 0, 5);
        System.arraycopy(out, 0, concated, 5, out.length);
        oStream.write(Base64.getEncoder().encode(concated));
      } else {
        oStream.write(prefix);
        oStream.write(out);
      }
    } catch (IOException e) {
      // TODO what to do here?
      LOG.info("can't write?");
    }
  }

  private void logPrefix(byte[] p) {
    LOG.info("LENGTH : " + p.length + ", " + p[0] + ", " + p[1] + ", " + p[2] + ", " + p[3] + ", " + p[4]);
  }
}
