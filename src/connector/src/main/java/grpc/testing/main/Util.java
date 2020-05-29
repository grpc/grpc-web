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
// *******************  DO NOT EDIT
// This is copy of the following:
//  github.com/grpc/grpc-java/blob/master/interop-testing/src/main/java/io/grpc/testing/integration/Util.java

package grpc.testing.main;

import io.grpc.Metadata;
import io.grpc.protobuf.lite.ProtoLiteUtils;
import grpc.testing.Messages;

/**
 * Utility methods to support integration testing.
 */
public class Util {

  public static final Metadata.Key<Messages.SimpleContext> METADATA_KEY =
      Metadata.Key.of(
          "grpc.testing.SimpleContext" + Metadata.BINARY_HEADER_SUFFIX,
          ProtoLiteUtils.metadataMarshaller(Messages.SimpleContext.getDefaultInstance()));
  public static final Metadata.Key<String> ECHO_INITIAL_METADATA_KEY
      = Metadata.Key.of("x-grpc-test-echo-initial", Metadata.ASCII_STRING_MARSHALLER);
  public static final Metadata.Key<byte[]> ECHO_TRAILING_METADATA_KEY
      = Metadata.Key.of("x-grpc-test-echo-trailing-bin", Metadata.BINARY_BYTE_MARSHALLER);
}
