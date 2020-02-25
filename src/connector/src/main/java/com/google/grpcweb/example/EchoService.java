package com.google.grpcweb.example;

import com.google.grpcweb.example.EchoRequest;
import com.google.grpcweb.example.EchoResponse;
import com.google.grpcweb.example.EchoServiceGrpc;
import com.google.grpcweb.RequestHandler;
import com.google.grpcweb.Factory;
import com.google.grpcweb.Flags;
import io.grpc.Server;
import io.grpc.ServerBuilder;
import io.grpc.stub.StreamObserver;
import java.util.logging.Logger;

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

  private static Server startGrpcService(int port) throws Exception {
    Server grpcServer = ServerBuilder.forPort(port)
        .addService(new EchoService())
        .build();
    grpcServer.start();
    System.out.println("****  started gRPC Service on port# " + port);
    return grpcServer;
  }

  private static void listenForGrpcWebReq(int port, Factory factory) throws Exception {
    org.eclipse.jetty.server.Server jServer = new org.eclipse.jetty.server.Server(port);
    jServer.setHandler(new RequestHandler(factory));
    jServer.start();
    System.out.println("****  started gRPC-web Service on port# " + port);
  }

  public static void main(String[] args) throws Exception {
    // PUNT accept these as flags
    int grpcPort = 9090;
    int grpcWebPort = 8081;

    Server grpcServer = startGrpcService(grpcPort);
    listenForGrpcWebReq(grpcWebPort, new Factory(new Flags(grpcPort, grpcWebPort)));
    grpcServer.awaitTermination();
  }
}
