package com.google.grpcweb;

import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;

/**
 * Manages the connection pool to talk to the grpc-service
 */
class GrpcServiceConnectionManager {
  private final int mGrpcPortNum;

  GrpcServiceConnectionManager(int grpcPortNum) {
    mGrpcPortNum  = grpcPortNum;
  }

  ManagedChannel getChannel() {
    // TODO: Manage a connection pool.
    return ManagedChannelBuilder.forAddress("localhost", mGrpcPortNum)
        .usePlaintext()
        .build();
  }
}
