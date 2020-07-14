package com.google.grpcweb;

public class GrpcPortNumRelay {
  public static void setGrpcPortNum(int i) {
    // TODO This class & method names are wrong - involves more than just setting the portnum
    GrpcWebGuiceModule.init(i);
  }
}
