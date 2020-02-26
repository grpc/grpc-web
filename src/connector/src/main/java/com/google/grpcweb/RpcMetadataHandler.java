package com.google.grpcweb;

import io.grpc.ManagedChannel;
import java.lang.reflect.Method;

class RpcMetadataHandler {
  private final Factory mFactory;

  RpcMetadataHandler(Factory factory) {
    mFactory = factory;
  }

  Object getRpcStub(Class cls) {
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
   * Find method with one param!
   */
  static Method getRpcMethod(Object stub, String rpcMethodName) {
    Method rpcMethodObj = null;
    for (Method m : stub.getClass().getMethods()) {
      if (m.getName().equals(rpcMethodName) && (m.getParameterCount() == 1)) {
        rpcMethodObj = m;
        break;
      }
    }

    if (rpcMethodObj == null) {
      throw new IllegalArgumentException("Couldn't find rpcmethod with one param");
    }
    return rpcMethodObj;
  }
}
