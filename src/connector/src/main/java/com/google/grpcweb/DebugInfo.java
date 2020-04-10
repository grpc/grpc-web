package com.google.grpcweb;

import java.util.Enumeration;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.servlet.http.HttpServletRequest;

class DebugInfo {
  private static final Logger LOGGER = Logger.getLogger(DebugInfo.class.getName());

  static void printRequest(HttpServletRequest req) {
    if (!LOGGER.isLoggable(Level.FINE)) return;

    StringBuilder sb = new StringBuilder();
    Enumeration<String> headerNames = req.getHeaderNames();
    while (headerNames.hasMoreElements()) {
      String headerName = headerNames.nextElement();
      Enumeration<String> headers = req.getHeaders(headerName);
      while (headers.hasMoreElements()) {
        String headerValue = headers.nextElement();
        sb.append("\n\t" + headerName + " = " + headerValue);
      }
    }
    sb.append("\n\t ContextPath: ").append(req.getContextPath());
    sb.append("\n\t LocalAddr: ").append(req.getLocalAddr());
    sb.append("\n\t LocalName: ").append(req.getLocalName());
    sb.append("\n\t LocalPort: ").append(req.getLocalPort());
    sb.append("\n\t PathInfo: ").append(req.getPathInfo());
    sb.append("\n\t PathTranslated: ").append(req.getPathTranslated());
    sb.append("\n\t Protocol: ").append(req.getProtocol());
    sb.append("\n\t RemoteAddr: ").append(req.getRemoteAddr());
    sb.append("\n\t RemoteHost: ").append(req.getRemoteHost());
    sb.append("\n\t RemotePort: ").append(req.getRemotePort());
    sb.append("\n\t RequestURI: ").append(req.getRequestURI());
    sb.append("\n\t RequestURL: ").append(req.getRequestURL());
    sb.append("\n\t Scheme: ").append(req.getScheme());
    sb.append("\n\t ServerName: ").append(req.getServerName());
    sb.append("\n\t ServerPort: ").append(req.getServerPort());
    sb.append("\n\t ServletPath: ").append(req.getServletPath());
    sb.append("\n\t Method: ").append(req.getMethod());
    LOGGER.fine(sb.toString());
  }
}
