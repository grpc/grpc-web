package com.google.grpcweb;

public class Flags {
  private final int mGrpcPortNum;
  private final int mGrpcWebPortNum;

  public Flags(int grpcPortNum, int grpcWebPortNum) {
    mGrpcPortNum = grpcPortNum;
    mGrpcWebPortNum = grpcWebPortNum;
  }
  public int getGrpcWebPortNum() {return mGrpcWebPortNum;}
  public int getGrpcPortNum() {return mGrpcPortNum;}
}
