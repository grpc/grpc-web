package grpcweb.examples.greeter;

import grpcweb.examples.greeter.GreeterOuterClass.HelloRequest;
import java.io.IOException;
import java.util.Properties;

class Util {
  static byte[] packageReqObjIntoGrpcwebProtocol(HelloRequest req) {
    byte[] reqObjBytes = req.toByteArray();
    int len = reqObjBytes.length;
    byte[] packagedBytes = new byte[5 + len];
    packagedBytes[0] = (byte) 0x00;
    packagedBytes[1] = (byte) ((len >> 24) & 0xff);
    packagedBytes[2] = (byte) ((len >> 16) & 0xff);
    packagedBytes[3] = (byte) ((len >> 8) & 0xff);
    packagedBytes[4] = (byte) ((len >> 0) & 0xff);
    System.arraycopy(reqObjBytes, 0, packagedBytes, 5, len);
    return packagedBytes;
  }

  private static int getIntPropertyValue(String s) throws IOException {
    java.io.InputStream inputStream =
        Thread.currentThread().getContextClassLoader().getResourceAsStream("my.properties");
    java.util.Properties properties = new Properties();
    properties.load(inputStream);
    return Integer.parseInt(properties.getProperty(s));
  }

  static int getGrpcServicePortNum() throws IOException {
    return getIntPropertyValue("grpc-port");
  }

  static int getGrpcwebServicePortNum() throws IOException {
    return getIntPropertyValue("grpc-web-port");
  }
}
