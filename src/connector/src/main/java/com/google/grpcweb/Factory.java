package com.google.grpcweb;

/**
 * Object Creation Factory that maintains Singletons.
 * This could be replaced with Injection.
 *
 * This is primarily to make unittesting easier for callers of objects supplied by this factory.
 */
public class Factory {
  private final GrpcServiceConnectionManager mGrpcServiceConnectionManager;
  private static Factory mInstance;

  public synchronized static void createSingleton(int grpcPortNum) {
    if (mInstance == null) {
      mInstance = new Factory(grpcPortNum);
    }
  }

  static Factory getInstance() { return mInstance;}

  private Factory(int grpcPortNum) {
    mGrpcServiceConnectionManager = new GrpcServiceConnectionManager(grpcPortNum);
  }

  GrpcServiceConnectionManager getGrpcServiceConnectionManager() {
    return mGrpcServiceConnectionManager;
  }
}
