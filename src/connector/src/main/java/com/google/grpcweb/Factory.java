package com.google.grpcweb;

/**
 * Object Creation Factory that maintains Singletons.
 * This could be replaced with Injection.
 *
 * This is primarily to make unittesting easier for callers of objects supplied by this factory.
 */
class Factory {
  private final DebugInfo mDebugInfo;
  private final Reflect mReflect;
  private final SendResponse mSendResponse;
  private final GrpcServiceConnectionManager mGrpcServiceConnectionManager;

  public Factory(int grpcPortNum) {
    mDebugInfo = new DebugInfo();
    mReflect = new Reflect();
    mSendResponse = new SendResponse();
    mGrpcServiceConnectionManager = new GrpcServiceConnectionManager(grpcPortNum);
  }

  DebugInfo getDebugInfo() { return mDebugInfo;}
  Reflect getReflect() { return mReflect;}
  MessageHandler getMessageHandler() { return new MessageHandler();}
  SendResponse getSendResponse() {return mSendResponse;}
  GrpcServiceConnectionManager getGrpcServiceConnectionManager() {
    return mGrpcServiceConnectionManager;
  }
  RpcMetadataHandler getRpcMetadataHandler() {
    return new RpcMetadataHandler(this);
  }
}
