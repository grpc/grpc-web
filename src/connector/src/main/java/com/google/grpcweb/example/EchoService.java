package com.google.grpcweb.example;

import io.grpc.stub.StreamObserver;
import java.util.logging.Logger;

/**
 * Implements the service methods defined in echo_service_example.proto
 */
public class EchoService extends EchoServiceGrpc.EchoServiceImplBase {
  private static final Logger LOGGER = Logger.getLogger(EchoService.class.getName());

  @Override
  public void echoBack(EchoRequest request, StreamObserver<EchoResponse> responseObserver) {
    LOGGER.info(request.toString());
    EchoResponse response = EchoResponse.newBuilder()
        .setMessage(request.getMessage() + " responding back")
        .build();
    responseObserver.onNext(response);
    responseObserver.onCompleted();
  }
}
