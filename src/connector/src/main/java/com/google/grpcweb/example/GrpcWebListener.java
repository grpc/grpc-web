package com.google.grpcweb.example;

import com.google.grpcweb.GrpcWebTrafficHandler;
import java.util.logging.Logger;

/**
 * A simple class w/ single method to start listening on the given grpc-web port#.
 */
class GrpcWebListener {
  private static final Logger LOGGER = Logger.getLogger(GrpcWebListener.class.getName());
  private final int mGrpcPort;
  private final int mGrpcWebPort;

  GrpcWebListener(int grpcPort, int grpcWebPort) {
    mGrpcPort = grpcPort;
    mGrpcWebPort = grpcWebPort;
  }

  void listenForGrpcWebReq() throws Exception {
    // Initialize the Main Module for grpc-web
    // It takes a single param: the port# the gRPC Service itself is listening on.
    // It is used by the grpc-web code to talk to the service by connecting to it on that port.
    GrpcWebTrafficHandler grpcWebTrafficHandler = new GrpcWebTrafficHandler(mGrpcPort);

    // Start a jetty server to listen on the grpc-web port#
    org.eclipse.jetty.server.Server jServer = new org.eclipse.jetty.server.Server(mGrpcWebPort);
    jServer.setHandler(grpcWebTrafficHandler.getRequestHandler());
    jServer.start();

    LOGGER.info("****  started gRPC-web Service on port# " + mGrpcWebPort);
  }
}
