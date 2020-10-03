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
