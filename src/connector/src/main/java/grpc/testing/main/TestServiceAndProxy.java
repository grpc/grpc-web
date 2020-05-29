package grpc.testing.main;

import com.google.grpcweb.CorsFilter;
import com.google.grpcweb.Factory;
import com.google.grpcweb.GrpcWebTrafficServlet;
import io.grpc.Server;
import io.grpc.ServerBuilder;
import io.grpc.ServerInterceptors;
import java.util.EnumSet;
import java.util.concurrent.Executors;
import java.util.logging.Logger;
import javax.servlet.DispatcherType;
import org.eclipse.jetty.servlet.ServletHandler;

/**
 * This class starts the service on a port (GRPC_PORT) and starts the grpc-web proxy on
 * a different port (GRPC_WEB_PORT).
 */
public class TestServiceAndProxy {
  private static final Logger LOGGER = Logger.getLogger(TestServiceAndProxy.class.getName());
  private static final int GRPC_PORT = 7074;
  private static final int GRPC_WEB_PORT = 8080;

  private static Server startGrpcService(int port) throws Exception {

    Server grpcServer = ServerBuilder.forPort(port)
        .addService(
            ServerInterceptors.intercept(
                new TestServiceImpl(Executors.newSingleThreadScheduledExecutor()),
                TestServiceImpl.interceptors()))
        .build();
    grpcServer.start();
    LOGGER.info("****  started gRPC Service on port# " + port);
    return grpcServer;
  }

  private static void listenForGrpcWebReq(int grpcWebPort) throws Exception {
    // Start a jetty server to listen on the grpc-web port#
    org.eclipse.jetty.server.Server jServer = new org.eclipse.jetty.server.Server(grpcWebPort);
    ServletHandler handler = new ServletHandler();
    jServer.setHandler(handler);
    handler.addFilterWithMapping(CorsFilter.class, "/*",
        EnumSet.of(DispatcherType.REQUEST));
    handler.addServletWithMapping(GrpcWebTrafficServlet.class, "/*");
    jServer.start();
    LOGGER.info("****  started gRPC-web Service on port# " + grpcWebPort);
  }

  public static void main(String[] args) throws Exception {
    Factory.createSingleton(GRPC_PORT);
    Server grpcServer = startGrpcService(GRPC_PORT);
    listenForGrpcWebReq(GRPC_WEB_PORT);
    grpcServer.awaitTermination();
  }
}
