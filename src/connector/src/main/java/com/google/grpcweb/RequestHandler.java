/*
 * Copyright 2020  Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.google.grpcweb;

import com.google.inject.Inject;
import io.grpc.Channel;
import io.grpc.Metadata;
import io.grpc.Status;
import io.grpc.stub.MetadataUtils;
import io.grpc.stub.StreamObserver;
import java.lang.invoke.MethodHandles;
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
  private static final Logger LOG =
      Logger.getLogger(MethodHandles.lookup().lookupClass().getName());

  private final MessageHandler mMessageHandler;
  private final GrpcServiceConnectionManager mGrpcServiceConnectionManager;

  @Inject
  RequestHandler(GrpcServiceConnectionManager g, MessageHandler m) {
    mMessageHandler = m;
    mGrpcServiceConnectionManager = g;
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
        LOG.info("incorrect classname in the request: " + className);
        // incorrect classname specified in the request.
        sendResponse.returnUnimplementedStatusCode();
        return;
      }

      // Create a ClientInterceptor object
      CountDownLatch latch = new CountDownLatch(1);
      GrpcWebClientInterceptor interceptor =
          new GrpcWebClientInterceptor(resp, latch, sendResponse);
      Channel channel = mGrpcServiceConnectionManager.getChannelWithClientInterceptor(interceptor);

      // get the stub for the rpc call and the method to be called within the stub
      io.grpc.stub.AbstractStub asyncStub = getRpcStub(channel, cls, "newStub");
      Metadata headers = MetadataUtil.getHtpHeaders(req);
      if (!headers.keys().isEmpty()) {
        asyncStub = MetadataUtils.attachHeaders(asyncStub, headers);
      }
      Method asyncStubCall = getRpcMethod(asyncStub, methodName);
      // Get the input object bytes
      ServletInputStream in = req.getInputStream();
      MessageDeframer deframer = new MessageDeframer();
      Object inObj = null;
      if (deframer.processInput(in, contentType)) {
        inObj = mMessageHandler.getInputProtobufObj(asyncStubCall, deframer.getMessageBytes());
      }

      // Invoke the rpc call
      asyncStubCall.invoke(asyncStub, inObj,
          new GrpcCallResponseReceiver(sendResponse, latch));
      if (!latch.await(500, TimeUnit.MILLISECONDS)) {
        LOG.warning("grpc call took too long!");
      }
    } catch (Exception e) {
      LOG.info("Exception occurred: " + e.getMessage());
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
      LOG.info("no such class " + className);
    }
    return rpcClass;
  }

  private io.grpc.stub.AbstractStub getRpcStub(Channel ch, Class cls, String stubName) {
    try {
      Method m = cls.getDeclaredMethod(stubName, io.grpc.Channel.class);
      return (io.grpc.stub.AbstractStub) m.invoke(null, ch);
    } catch (Exception e) {
      LOG.warning("Error when fetching " + stubName + " for: " + cls.getName());
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
      sendResponse.writeError(s);
      latch.countDown();
    }

    @Override
    public void onCompleted() {
      sendResponse.writeStatusTrailer(Status.OK);
      latch.countDown();
    }
  }
}
