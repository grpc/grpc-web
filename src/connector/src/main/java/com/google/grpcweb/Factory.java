package com.google.grpcweb;

/**
 * Object Creation Factory that maintains Singletons.
 * This could be replaced with Injection.
 *
 * This is primarily to make unittesting easier for the callers for this factory
 */
public class Factory {
  private final DebugInfo mDebugInfo;
  private final Reflect mReflect;
  private final Flags mFlags;
  private final SendResponse mSendResponse;

  public Factory(Flags flags) {
    mDebugInfo = new DebugInfo();
    mReflect = new Reflect();
    mFlags = flags;
    mSendResponse = new SendResponse();
  }
  DebugInfo getDebugInfo() { return mDebugInfo;}
  Reflect getReflect() { return mReflect;}
  GrpcWebHandler getGrpcWebHandler() { return new GrpcWebHandler();}
  Flags getFlags() {return mFlags;}
  SendResponse getSendResponse() {return mSendResponse;}
}
