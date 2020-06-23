package com.google.grpcweb;

public class GrpcPortNumRelay {
  private static int sGrpcPortNum = 0;

  public static void setGrpcPortNum(int i) {
    // make sure this is set only once
    if (sGrpcPortNum == 0) sGrpcPortNum = i;
  }

  static int getGrpcPortNum() {
    return sGrpcPortNum;
  }
}
