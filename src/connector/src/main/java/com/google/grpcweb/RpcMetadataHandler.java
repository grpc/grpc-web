package com.google.grpcweb;

import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import java.lang.reflect.Method;

public class RpcMetadataHandler {
  public static Object getRpcStub(Class cls, int grpcPortNum) {
    Method newBlockingStubMethod;
    try {
      newBlockingStubMethod = cls.getDeclaredMethod("newBlockingStub",
          io.grpc.Channel.class);
    } catch (NoSuchMethodException e) {
      throw new IllegalArgumentException(e);
    }

    // invoke the newBlockingStub() method
    final ManagedChannel channel =
        ManagedChannelBuilder.forAddress("localhost", grpcPortNum)
            .usePlaintext()
            .build();
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
  public static Method getRpcMethod(Object stub, String rpcMethodName) {
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
