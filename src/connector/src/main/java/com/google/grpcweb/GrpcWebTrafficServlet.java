package com.google.grpcweb;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * The main class that handles all the grpc-web traffic.
 */
public class GrpcWebTrafficServlet extends HttpServlet {
  private static final long serialVersionUID = 1L;

  @Override
  protected void doGet(HttpServletRequest request, HttpServletResponse response) {
    new RequestHandler(mFactory).handle(request, response);
  }

  @Override
  protected void doPost(HttpServletRequest request, HttpServletResponse response) {
    doGet(request, response);
  }

  private final Factory mFactory;

  public GrpcWebTrafficServlet() {
    mFactory = Factory.getInstance();
  }
}
