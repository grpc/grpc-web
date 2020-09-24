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

// ================================================
//
//      This is for testing only. Just to demonstrate a simple
//      Java client to send grpc-web request and receive response
//      and validate the response.
//
// ================================================

package grpcweb.examples.greeter;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import com.google.protobuf.InvalidProtocolBufferException;
import grpcweb.examples.greeter.GreeterOuterClass.HelloReply;
import grpcweb.examples.greeter.GreeterOuterClass.HelloRequest;
import java.io.IOException;
import java.lang.invoke.MethodHandles;
import java.nio.ByteBuffer;
import java.util.logging.Logger;
import org.apache.http.HttpVersion;
import org.apache.http.client.fluent.Request;
import org.apache.http.entity.ContentType;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;

/**
 * A simple client that requests a greeting from the {@link GreeterService}.
 */
@RunWith(JUnit4.class)
public class GreeterClientTest {
  private static final Logger LOG =
      Logger.getLogger(MethodHandles.lookup().lookupClass().getName());

  private void validateResponse(byte[] response) throws InvalidProtocolBufferException {
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
    // LOG.info("received trailer: " + trailerStr);
    assertTrue(trailerStr.startsWith("grpc-status:0"));
  }

  private byte[] sendGrpcWebReqAndReceiveResponse() throws IOException {
    // create a HelloRequest obj
    HelloRequest reqObj = HelloRequest.newBuilder().setName("foo").build();
    byte[] packagedBytes = Util.packageReqObjIntoGrpcwebProtocol(reqObj);

    // send request to the grpc-web server
    ContentType contentType = ContentType.create("application/grpc-web");
    int grpcWebPort = Util.getGrpcwebServicePortNum();
    return Request.Post("http://localhost:" + grpcWebPort +
        "/grpcweb.examples.greeter.Greeter/SayHello")
        .useExpectContinue()
        .version(HttpVersion.HTTP_1_1)
        .bodyByteArray(packagedBytes, contentType)
        .execute().returnContent().asBytes();
  }

  @Test
  public void testGreeterClient() throws Exception {
    new StartServiceAndGrpcwebProxy().start();
    byte[] response = sendGrpcWebReqAndReceiveResponse();
    validateResponse(response);
  }
}
