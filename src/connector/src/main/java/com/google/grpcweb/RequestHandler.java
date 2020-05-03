package com.google.grpcweb;

import io.grpc.ManagedChannel;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import java.lang.reflect.Method;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.logging.Logger;
import javax.servlet.ServletInputStream;
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

  public void handle(final HttpServletRequest req, final HttpServletResponse resp) {
    DebugInfo.printRequest(req);
    MessageHandler.ContentType contentType = mMessageHandler.validateContentType(req);
    SendResponse sendResponse = new SendResponse(req, resp);

    try {
      // From the request, get the rpc-method name and class name and then get their corresponding
      // concrete objects.
      Pair<String, String> classAndMethodNames = getClassAndMethod(req);
      String className = classAndMethodNames.getLeft();
      String methodName = classAndMethodNames.getRight();
      Class cls = getClassObject(className);
      if (cls == null) {
        // incorrect classname specified in the request.
        sendResponse.returnUnimplementedStatusCode();
        return;
      }

      // get the stubs for the rpc call and the method to be called within the stubs
      Object asyncStub = getRpcStub(cls, "newStub");
      Method asyncStubCall = getRpcMethod(asyncStub, methodName);

      // Get the input object bytes
      ServletInputStream in = req.getInputStream();
      MessageDeframer deframer = new MessageDeframer();
      Object inObj = null;
      if (deframer.processInput(in, contentType)) {
        inObj = mMessageHandler.getInputProtobufObj(asyncStubCall, deframer.getMessageBytes());
      }

      // Invoke the rpc call
      CountDownLatch latch = new CountDownLatch(1);
      asyncStubCall.invoke(asyncStub, inObj,
          new GrpcCallResponseReceiver(sendResponse, latch));
      latch.await(500, TimeUnit.MILLISECONDS);
    } catch (Exception e) {
      LOGGER.info(e.getMessage());
      resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
    }
  }

  private Pair<String, String> getClassAndMethod(HttpServletRequest req)
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
    return new ImmutablePair<>(rpcClassName, rpcMethodName);
  }

  private Class<?> getClassObject(String className) {
    Class rpcClass = null;
    try {
      rpcClass = Class.forName(className + "Grpc");
    } catch (ClassNotFoundException e) {
      LOGGER.info("no such class " + className);
    }
    return rpcClass;
  }

  private Object getRpcStub(Class cls, String stubName) {
    try {
      Method m = cls.getDeclaredMethod(stubName, io.grpc.Channel.class);
      ManagedChannel channel = mFactory.getGrpcServiceConnectionManager().getChannel();
      return m.invoke(null, channel);
    } catch (Exception e) {
      LOGGER.warning("Error when fetching " + stubName + " for: " + cls.getName());
      throw new IllegalArgumentException(e);
    }
  }

  /**
   * Find the matching method in the stub class.
   */
  private Method getRpcMethod(Object stub, String rpcMethodName) {
    for (Method m : stub.getClass().getMethods()) {
      if (m.getName().equals(rpcMethodName)) {
        return m;
      }
    }
    throw new IllegalArgumentException("Couldn't find rpcmethod: " + rpcMethodName);
  }

  private static class GrpcCallResponseReceiver<Object> implements StreamObserver {
    private final SendResponse sendResponse;
    private final CountDownLatch latch;

    GrpcCallResponseReceiver(SendResponse s, CountDownLatch c) {
      sendResponse = s;
      latch = c;
    }

    @Override
    public void onNext(java.lang.Object resp) {
      // TODO verify that the resp object is of Class instance returnedCls.
      byte[] outB = ((com.google.protobuf.GeneratedMessageV3)resp).toByteArray();
      sendResponse.writeResponse(outB);
    }

    @Override
    public void onError(Throwable t) {
      Status s = Status.fromThrowable(t);
      LOGGER.info("status is " + s.toString());
      sendResponse.writeError(s);
      latch.countDown();
    }

    @Override
    public void onCompleted() {
      sendResponse.writeGrpcStatusTrailer(Status.OK);
      sendResponse.writeOk();
      latch.countDown();
    }
  }
}
