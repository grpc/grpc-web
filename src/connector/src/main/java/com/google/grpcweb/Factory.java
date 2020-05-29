package com.google.grpcweb;

/**
 * Object Creation Factory that maintains Singletons.
 * This could be replaced with Injection.
 *
 * This is primarily to make unittesting easier for callers of objects supplied by this factory.
 */
public class Factory {
  private static Factory mInstance;
  private int mGrpPortNum;

  public synchronized static void createSingleton(int grpcPortNum) {
    if (mInstance == null) {
      mInstance = new Factory(grpcPortNum);
    }
  }

  static Factory getInstance() { return mInstance;}

  private Factory(int grpcPortNum) {
    mGrpPortNum = grpcPortNum;
  }

  GrpcServiceConnectionManager getGrpcServiceConnectionManager() {
    return new GrpcServiceConnectionManager(mGrpPortNum);
  }
}
