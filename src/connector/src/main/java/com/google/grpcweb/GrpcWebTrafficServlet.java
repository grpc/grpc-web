package com.google.grpcweb;

import com.google.common.annotations.VisibleForTesting;
import java.io.IOException;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * The main class that handles all the grpc-web traffic.
 */
public class GrpcWebTrafficServlet extends HttpServlet {
  private static final long serialVersionUID = 1L;

  @Override
  protected void doGet(HttpServletRequest request, HttpServletResponse response)
      throws ServletException, IOException {
    new RequestHandler(mFactory).handle(request, response);
    // response.setContentType("text/html");
    // response.setStatus(HttpServletResponse.SC_OK);
    // response.getWriter().println("<h1>Hello SimpleServlet</h1>");
  }

  @Override
  protected void doPost(HttpServletRequest request, HttpServletResponse response)
      throws ServletException, IOException {
    doGet(request, response);
  }

  private final Factory mFactory;

  public GrpcWebTrafficServlet() {
    mFactory = Factory.getInstance();
  }

  @VisibleForTesting
  GrpcWebTrafficServlet(Factory factory) {
    mFactory = factory;
  }
}
