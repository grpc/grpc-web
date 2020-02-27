package com.google.grpcweb;

import com.google.common.annotations.VisibleForTesting;

/**
 * The main class that handles all the grpc-web traffic.
 */
public class GrpcWebTrafficHandler {
  private final RequestHandler mRequestHandler;
  private final Factory mFactory;

  public GrpcWebTrafficHandler(int grpcPortNum) {
    mFactory = new Factory(grpcPortNum);
    mRequestHandler = new RequestHandler(mFactory);
  }

  @VisibleForTesting
  GrpcWebTrafficHandler(Factory factory) {
    mFactory = factory;
    mRequestHandler = new RequestHandler(factory);
  }

  public RequestHandler getRequestHandler() { return mRequestHandler;}
}
