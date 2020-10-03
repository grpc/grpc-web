/*
 * Copyright 2020  Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package io.grpcweb;

import io.grpc.Metadata;
import io.grpc.Status;
import io.grpcweb.MessageHandler.ContentType;
import java.io.IOException;
import java.lang.invoke.MethodHandles;
import java.util.Map;
import java.util.logging.Logger;
import javax.servlet.ServletOutputStream;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.Base64;

class SendResponse {
  private static final Logger LOG =
      Logger.getLogger(MethodHandles.lookup().lookupClass().getName());

  private final String mContentType;
  private final HttpServletResponse mResp;
  private boolean isFinalResponseSent = false;

  SendResponse(HttpServletRequest req, HttpServletResponse resp) {
    mContentType = req.getContentType();
    mResp = resp;
  }

  synchronized void writeHeaders(Metadata headers) {
    if (isFinalResponseSent) return;
    mResp.setContentType(mContentType);
    mResp.setHeader("transfer-encoding", "chunked");
    mResp.setHeader("trailer", "grpc-status,grpc-message");
    if (headers == null) return;
    Map<String, String> ht = MetadataUtil.getHttpHeadersFromMetadata(headers);
    StringBuffer sb = new StringBuffer();
    for (String key : ht.keySet()) {
      mResp.setHeader(key, ht.get(key));
    }
  }

  synchronized void returnUnimplementedStatusCode() {
    if (isFinalResponseSent) return;
    writeHeaders(null);
    writeStatusTrailer(Status.UNIMPLEMENTED);
    isFinalResponseSent = true;
  }

  synchronized void writeError(Status s) {
    if (isFinalResponseSent) return;
    writeHeaders(null);
    writeStatusTrailer(s);
    isFinalResponseSent = true;
  }

  synchronized void writeStatusTrailer(Status status) {
    writeTrailer(status, null);
  }

  synchronized void writeTrailer(Status status, Metadata trailer) {
    if (isFinalResponseSent) return;
    StringBuffer sb = new StringBuffer();
    if (trailer != null) {
      Map<String, String> ht = MetadataUtil.getHttpHeadersFromMetadata(trailer);
      for (String key : ht.keySet()) {
        sb.append(String.format("%s:%s\r\n", key, ht.get(key)));
      }
    }
    sb.append(String.format("grpc-status:%d\r\n", status.getCode().value()));
    if (status.getDescription() != null && !status.getDescription().isEmpty()) {
      sb.append(String.format("grpc-message:%s\r\n", status.getDescription()));
    }
    LOG.fine("writing trailer: " + sb.toString());
    writeResponse(sb.toString().getBytes(), MessageFramer.Type.TRAILER);
    writeOk();
  }

  synchronized void writeResponse(byte[] out) {
    writeResponse(out, MessageFramer.Type.DATA);
  }

  private void writeResponse(byte[] out, MessageFramer.Type type) {
    if (isFinalResponseSent) return;
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
      LOG.warning("can't write?");
    }
  }

  private void writeOk() {
    mResp.setStatus(HttpServletResponse.SC_OK);
    isFinalResponseSent = true;
  }
}
