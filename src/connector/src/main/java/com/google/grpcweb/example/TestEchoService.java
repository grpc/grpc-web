package com.google.grpcweb.example;

import io.grpc.Server;
import io.grpc.ServerBuilder;
import java.util.logging.Logger;

public class TestEchoService {
  private static final Logger LOGGER = Logger.getLogger(TestEchoService.class.getName());

  private static Server startGrpcService(int port) throws Exception {
    Server grpcServer = ServerBuilder.forPort(port)
        .addService(new EchoService())
        .build();
    grpcServer.start();
    LOGGER.info("****  started gRPC Service on port# " + port);
    return grpcServer;
  }

  public static void main(String[] args) throws Exception {
    // PUNT accept these as flags in pom.xml
    int grpcPort = 9090;
    int grpcWebPort = 8081;

    Server grpcServer = startGrpcService(grpcPort);
    new GrpcWebListener(grpcPort, grpcWebPort).listenForGrpcWebReq();
    grpcServer.awaitTermination();
  }
}
