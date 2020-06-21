package grpcweb.examples.greeter;

import com.google.grpcweb.GrpcPortNumRelay;
import com.google.grpcweb.JettyWebserverForGrpcwebTraffic;
import io.grpc.BindableService;
import io.grpc.Server;
import io.grpc.ServerBuilder;
import java.lang.invoke.MethodHandles;
import java.util.Properties;
import java.util.logging.Logger;

/**
 * This class starts the service on a port (property: grpc-port)
 * and starts the grpc-web proxy on a different port (property: grpc-web-port).
 */
class StartServiceAndGrpcwebProxy {
  private static final Logger LOG =
      Logger.getLogger(MethodHandles.lookup().lookupClass().getName());
  java.util.Properties properties;
  private int grpcWebPort;

  private void startGrpcService(int port) throws Exception {
    Server grpcServer = ServerBuilder.forPort(port)
        .addService((BindableService) new GreeterService())
        .build();
    grpcServer.start();
    LOG.info("****  started gRPC Service on port# " + port);
  }

  int getGrpcwebPortNum() {
    return grpcWebPort;
  }

  void start() throws Exception {
    java.io.InputStream inputStream =
        Thread.currentThread().getContextClassLoader().getResourceAsStream("my.properties");
    properties = new Properties();
    properties.load(inputStream);
    int grpcPort = Integer.parseInt(properties.getProperty("grpc-port"));
    grpcWebPort = Integer.parseInt(properties.getProperty("grpc-web-port"));
    LOG.info("grpc-port = " + grpcPort + ", grpc-web-port = " + grpcWebPort);

    // Start the Grpc service on grpc-port
    startGrpcService(grpcPort);

    // Start the grpc-web proxy on grpc-web-port.
    (new JettyWebserverForGrpcwebTraffic(grpcWebPort)).start();
    // grpc-web proxy needs to know the grpc-port# so it could connect to the grpc service.
    GrpcPortNumRelay.setGrpcPortNum(grpcPort);
  }
}
