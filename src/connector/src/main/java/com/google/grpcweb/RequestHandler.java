package com.google.grpcweb;

import java.io.IOException;
import java.lang.reflect.Method;
import java.util.logging.Logger;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.apache.commons.lang3.tuple.Pair;
import org.eclipse.jetty.server.Request;
import org.eclipse.jetty.server.handler.AbstractHandler;

class RequestHandler extends AbstractHandler {
  private static final Logger LOGGER = Logger.getLogger(RequestHandler.class.getName());

  private final Factory mFactory;

  RequestHandler(Factory factory) {
    mFactory = factory;
  }

  @Override
  public void handle(
      String target, Request baseRequest, HttpServletRequest req, HttpServletResponse response)
      throws IOException, ServletException {
    mFactory.getDebugInfo().printRequest(req);
    response.setContentType("text/html; charset=utf-8");
    baseRequest.setHandled(true);

    try {

      // From the request, get the rpc-method name and class name and then get their corresponding
      // concrete objects.
      Pair<Class, String> classAndMethod = mFactory.getReflect().getClassAndMethod(req);

      // get the BlockingStub for the rpc call
      Object rpcStub = mFactory.getRpcMetadataHandler().getRpcStub(classAndMethod.getLeft());

      // get the rpc-method to be called from the BlockingStub Object..
      Method rpcMethod = RpcMetadataHandler.getRpcMethod(rpcStub, classAndMethod.getRight());

      MessageHandler messageHandler = mFactory.getMessageHandler();
      MessageHandler.ContentType contentType = messageHandler.validateContentType(req);
      Object outObj = messageHandler.invokeRpcAndGetResult(req, contentType,
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
