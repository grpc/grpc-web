package grpcweb.examples;

import java.io.IOException;
import java.util.Properties;

class Util {
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
