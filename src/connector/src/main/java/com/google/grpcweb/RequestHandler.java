package com.google.grpcweb;

import java.io.IOException;
import java.lang.reflect.Method;
import java.util.logging.Logger;
import javax.servlet.ServletException;
import javax.servlet.ServletInputStream;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.tuple.Pair;
import org.eclipse.jetty.server.Request;
import org.eclipse.jetty.server.handler.AbstractHandler;

public class RequestHandler extends AbstractHandler {
  private static final Logger LOGGER = Logger.getLogger(RequestHandler.class.getName());

  private final Factory mFactory;

  public RequestHandler(Factory factory) {
    mFactory = factory;
  }

  @Override
  public void handle(
      String target, Request baseRequest, HttpServletRequest req, HttpServletResponse response)
      throws IOException, ServletException {
    response.setContentType("text/html; charset=utf-8");
    baseRequest.setHandled(true);

    try {
      mFactory.getDebugInfo().printRequest(req);
      Flags mFlags = mFactory.getFlags();

      // From the request, get the rpc-method name and class name and then get their corresponding
      // concrete objects.
      Pair<Class, String> classAndMethod = mFactory.getReflect().getClassAndMethod(req);

      // get the BlockingStub for the rpc call
      Object rpcStub = RpcMetadataHandler.getRpcStub(classAndMethod.getLeft(),
                                                     mFlags.getGrpcPortNum());

      // get the rpc-method to be called from the BlockingStub Object..
      Method rpcMethod = RpcMetadataHandler.getRpcMethod(rpcStub, classAndMethod.getRight());

      GrpcWebHandler grpcWebHandler = mFactory.getGrpcWebHandler();
      GrpcWebHandler.ContentType contentType = grpcWebHandler.validateContentType(req);
      Object outObj = grpcWebHandler.invokeRpcAndGetResult(req, contentType,
                                                           rpcStub, rpcMethod);

      // get bytes from outObj protobuf
      byte[] outB = ((com.google.protobuf.GeneratedMessageV3) outObj).toByteArray();

      // Write response out
      mFactory.getSendResponse().writeResponse(response, outB);
      response.setStatus(HttpServletResponse.SC_OK);
    } catch (IllegalArgumentException e) {
      LOGGER.severe(e.getMessage());
      response.setStatus(HttpServletResponse.SC_FORBIDDEN);
    }
  }
}
