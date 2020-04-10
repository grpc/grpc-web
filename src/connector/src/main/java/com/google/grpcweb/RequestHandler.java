package com.google.grpcweb;

import io.grpc.ManagedChannel;
import java.io.IOException;
import java.lang.reflect.Method;
import java.util.logging.Logger;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.apache.commons.lang3.tuple.ImmutablePair;
import org.apache.commons.lang3.tuple.Pair;

class RequestHandler {
  private static final Logger LOGGER = Logger.getLogger(RequestHandler.class.getName());

  private final Factory mFactory;
  private final MessageHandler mMessageHandler;

  RequestHandler(Factory factory) {
    mFactory = factory;
    mMessageHandler = new MessageHandler();
  }

  public void handle(HttpServletRequest req, HttpServletResponse response)
      throws IOException {
    DebugInfo.printRequest(req);
    MessageHandler.ContentType contentType = mMessageHandler.validateContentType(req);

    try {
      // From the request, get the rpc-method name and class name and then get their corresponding
      // concrete objects.
      Pair<Class, String> classAndMethod = getClassAndMethod(req);

      // get the BlockingStub for the rpc call
      Object rpcStub = getRpcStub(classAndMethod.getLeft());

      // get the rpc-method to be called from the BlockingStub Object..
      Method rpcMethod = getRpcMethod(rpcStub, classAndMethod.getRight());

      // invoke the gRPC call and get the protobuf result obj
      Object result = mMessageHandler.invokeRpcAndGetResult(req, contentType,
                                                           rpcStub, rpcMethod);

      byte[] outB = (result == null)
          ? new byte[0]
          : ((com.google.protobuf.GeneratedMessageV3) result).toByteArray();

      // Write response out
      SendResponse.writeResponse(response, outB);
      response.setStatus(HttpServletResponse.SC_OK);
    } catch (IllegalArgumentException e) {
      LOGGER.info(e.getMessage());
      response.setStatus(HttpServletResponse.SC_OK);
    }
  }

  private Pair<Class, String> getClassAndMethod(HttpServletRequest req)
      throws IllegalArgumentException {
    String pathInfo = req.getPathInfo();
    // pathInfo starts with "/". ignore that first char.
    String[] rpcClassAndMethodTokens = pathInfo.substring(1).split("/");
    if (rpcClassAndMethodTokens.length != 2) {
      throw new IllegalArgumentException("incorrect pathinfo: " + pathInfo);
    }

    String rpcClassName = rpcClassAndMethodTokens[0];
    String rpcMethodNameRecvd = rpcClassAndMethodTokens[1];
    String rpcMethodName = rpcMethodNameRecvd.substring(0, 1).toLowerCase()
        + rpcMethodNameRecvd.substring(1);
    LOGGER.fine("Recvd method name = " + rpcMethodName
        + ", Rpc class name = " + rpcClassName);
    Class rpcClass;
    try {
      rpcClass = Class.forName(rpcClassName + "Grpc");
    } catch (ClassNotFoundException e) {
      throw new IllegalArgumentException(e);
    }
    return new ImmutablePair<>(rpcClass, rpcMethodName);
  }

  private Object getRpcStub(Class cls) {
    Method newBlockingStubMethod;
    try {
      newBlockingStubMethod = cls.getDeclaredMethod("newBlockingStub",
          io.grpc.Channel.class);
    } catch (NoSuchMethodException e) {
      throw new IllegalArgumentException(e);
    }

    // invoke the newBlockingStub() method
    ManagedChannel channel = mFactory.getGrpcServiceConnectionManager().getChannel();
    Object stub;
    try {
      stub = newBlockingStubMethod.invoke(null, channel);
    } catch (Exception e) {
      throw new IllegalArgumentException("invoking newBlockingStubMethod: " + e.getMessage());
    }

    if (stub == null) {
      throw new IllegalArgumentException("Unexpected: stb = null!");
    }
    return stub;
  }

  /**
   * Find the matching method with one param in the stub class.
   */
  private Method getRpcMethod(Object stub, String rpcMethodName) {
    Method rpcMethodObj = null;
    for (Method m : stub.getClass().getMethods()) {
      if (m.getName().equals(rpcMethodName) && (m.getParameterCount() == 1)) {
        rpcMethodObj = m;
        break;
      }
    }

    if (rpcMethodObj == null) {
      throw new IllegalArgumentException("Couldn't find rpcmethod");
    }
    return rpcMethodObj;
  }
}
