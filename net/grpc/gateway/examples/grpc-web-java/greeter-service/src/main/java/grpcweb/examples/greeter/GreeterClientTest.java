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
import java.lang.invoke.MethodHandles;
import java.nio.ByteBuffer;
import java.util.logging.Logger;

/**
 * A simple client that requests a greeting from the {@link GreeterService}.
 */
public class GreeterClientTest {
  private static final Logger LOG =
      Logger.getLogger(MethodHandles.lookup().lookupClass().getName());

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
    new StartServiceAndGrpcwebProxy().start();
    byte[] response = GreeterClient.sendGrpcWebReqAndReceiveResponse();
    validateResponse(response);
    System.exit(0);
  }
}
