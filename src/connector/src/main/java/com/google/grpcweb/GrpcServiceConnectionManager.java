package com.google.grpcweb;

import io.grpc.Channel;
import io.grpc.ClientInterceptors;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;

/**
 * TODO: Manage the connection pool to talk to the grpc-service
 */
class GrpcServiceConnectionManager {
  private final int mGrpcPortNum;

  GrpcServiceConnectionManager(int grpcPortNum) {
    mGrpcPortNum  = grpcPortNum;
  }

  private ManagedChannel getManagedChannel() {
    // TODO: Manage a connection pool.
    return ManagedChannelBuilder.forAddress("localhost", mGrpcPortNum)
        .usePlaintext()
        .build();
  }

  Channel getChannelWithClientInterceptor(GrpcWebClientInterceptor interceptor) {
    return ClientInterceptors.intercept(getManagedChannel(), interceptor);
  }
}
