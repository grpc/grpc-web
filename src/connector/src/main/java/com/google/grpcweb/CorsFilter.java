package com.google.grpcweb;

import java.io.IOException;
import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.apache.commons.lang3.StringUtils;
import com.google.common.net.HttpHeaders;

public class CorsFilter implements Filter {
  @Override
  public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
      throws IOException, ServletException {
    this.handle((HttpServletRequest)request, (HttpServletResponse)response);
    chain.doFilter(request, response);
  }

  private void handle(HttpServletRequest req, HttpServletResponse resp)
      throws IOException, ServletException {
    resp.setHeader(HttpHeaders.ACCESS_CONTROL_ALLOW_HEADERS,
        StringUtils.joinWith(",",
            "user-agent",
            "cache-control",
            "content-type",
            "content-transfer-encoding",
            "grpc-timeout",
            "keep-alive",
            "x-accept-content-transfer-encoding",
            "x-accept-response-streaming",
            "x-grpc-test-echo-initial",
            "x-grpc-test-echo-trailing-bin",
            "x-grpc-web",
            "x-user-agent"));
    resp.setHeader(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN,
        req.getHeader("Origin"));
    resp.setHeader(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS,
        "content-type,x-grpc-web");
    resp.setHeader(HttpHeaders.ACCESS_CONTROL_ALLOW_METHODS,
        "OPTIONS,GET,POST,HEAD");
    resp.setHeader(HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS,
        StringUtils.joinWith(",",
            "x-grpc-test-echo-initial",
            "x-grpc-test-echo-trailing-bin",
            "grpc-status",
            "grpc-message"));
  }

  @Override
  public void init(FilterConfig arg0) throws ServletException {}

  @Override
  public void destroy() {}
}
