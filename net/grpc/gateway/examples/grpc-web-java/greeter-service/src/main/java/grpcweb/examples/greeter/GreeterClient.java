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
//
// ================================================

package grpcweb.examples.greeter;

import grpcweb.examples.greeter.GreeterOuterClass.HelloRequest;
import java.io.IOException;
import org.apache.http.HttpVersion;
import org.apache.http.client.fluent.Request;
import org.apache.http.entity.ContentType;

/**
 * A simple client that requests a greeting from the {@link GreeterService}.
 */
public class GreeterClient {
  static byte[] sendGrpcWebReqAndReceiveResponse() throws IOException {
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

  public static void main(String[] args) throws Exception {
    System.out.println("Response to Hello Request is: " +
        new String(sendGrpcWebReqAndReceiveResponse()));
  }
}
