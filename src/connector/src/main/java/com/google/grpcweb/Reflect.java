package com.google.grpcweb;

import java.util.logging.Logger;
import javax.servlet.http.HttpServletRequest;
import org.apache.commons.lang3.tuple.ImmutablePair;
import org.apache.commons.lang3.tuple.Pair;

class Reflect {
  private static final Logger LOGGER = Logger.getLogger(Reflect.class.getName());

  public Reflect() {}

  /**
   * get class and method.
   */
  Pair<Class, String> getClassAndMethod(HttpServletRequest req)
      throws IllegalArgumentException {
    String pathInfo = req.getPathInfo();
    if (!pathInfo.startsWith("/$rpc/")) {
      throw new IllegalArgumentException("unknown pathinfo: " + pathInfo);
    }

    String rpcClassAndMethod = pathInfo.substring(6);
    String[] rpcClassAndMethodTokens = rpcClassAndMethod.split("/");
    if (rpcClassAndMethodTokens.length != 2) {
      throw new IllegalArgumentException("incorrect pathinfo: " + rpcClassAndMethod);
    }

    String rpcClassName = rpcClassAndMethodTokens[0];
    String rpcMethodNameRecvd = rpcClassAndMethodTokens[1];
    String rpcMethodName = rpcMethodNameRecvd.substring(0, 1).toLowerCase()
        + rpcMethodNameRecvd.substring(1);
    LOGGER.fine("Recvd method name = " + rpcMethodName);
    Class rpcClass;
    try {
      rpcClass = Class.forName(rpcClassName + "Grpc");
    } catch (ClassNotFoundException e) {
      throw new IllegalArgumentException(e);
    }
    return new ImmutablePair<>(rpcClass, rpcMethodName);
  }
}
