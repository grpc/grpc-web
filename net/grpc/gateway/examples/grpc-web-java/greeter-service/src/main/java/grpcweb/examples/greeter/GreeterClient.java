/*
 * Copyright 2020 The gRPC Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package grpcweb.examples.greeter;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import com.google.protobuf.InvalidProtocolBufferException;
import grpcweb.examples.greeter.GreeterOuterClass.HelloReply;
import grpcweb.examples.greeter.GreeterOuterClass.HelloRequest;
import java.lang.invoke.MethodHandles;
import java.nio.ByteBuffer;
import java.util.logging.Logger;
import org.apache.http.HttpVersion;
import org.apache.http.client.fluent.Request;
import org.apache.http.entity.ContentType;

/**
 * A simple client that requests a greeting from the {@link GreeterService}.
 */
public class GreeterClient {
  private static final Logger LOG =
      Logger.getLogger(MethodHandles.lookup().lookupClass().getName());

  private static byte[] packageReqObj(HelloRequest req) {
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

  private static void validateResponse(byte[] response) throws InvalidProtocolBufferException {
    LOG.info("Response length = " + response.length);
    LOG.info("Response is: " + new String(response));

    // validate the 1st byte
    assertEquals((byte)0x00, response[0]);

    int len = ByteBuffer.wrap(response, 1, 4).getInt();
    assertEquals(11, len);

    // copy len bytes into a byte array, which can be xlated into HelloResponse
    byte[] protoBytes = new byte[len];
    System.arraycopy(response, 5, protoBytes, 0, len);
    HelloReply reply = HelloReply.parseFrom(protoBytes);
    assertEquals("Hello foo", reply.getMessage());

    // if there is more data in the response, it should be a trailer.
    int offset = len + 5;
    int trailerBlockLen = response.length - offset;
    if (trailerBlockLen == 0) {
      // don't have any more bytes. we are done
      return;
    }
    assertEquals((byte)0x80, response[offset]);
    offset++;
    int trailerLen = ByteBuffer.wrap(response, offset, 4).getInt();
    assertTrue(trailerLen > 0);

    byte[] trailer = new byte[trailerLen];
    System.arraycopy(response, offset+4, trailer, 0, trailerLen);
    String trailerStr = new String(trailer);
    LOG.info("received trailer: " + trailerStr);
    assertTrue(trailerStr.startsWith("grpc-status:0"));
  }

  public static void main(String[] args) throws Exception {
    StartServiceAndGrpcwebProxy proxyStarter = new StartServiceAndGrpcwebProxy();
    proxyStarter.start();

    // create a HelloRequest obj
    HelloRequest reqObj = HelloRequest.newBuilder().setName("foo").build();
    byte[] packagedBytes = packageReqObj(reqObj);

    // send request to the grpc-web server
    ContentType contentType = ContentType.create("application/grpc-web");
    byte[] response = Request.Post("http://localhost:" + proxyStarter.getGrpcwebPortNum() +
        "/grpcweb.examples.greeter.Greeter/SayHello")
        .useExpectContinue()
        .version(HttpVersion.HTTP_1_1)
        .bodyByteArray(packagedBytes, contentType)
        .execute().returnContent().asBytes();
    validateResponse(response);
    System.exit(0);
  }
}
