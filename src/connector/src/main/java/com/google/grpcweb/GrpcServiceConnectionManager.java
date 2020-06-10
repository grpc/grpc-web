/*
 * Copyright 2020  Google LLC
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

package com.google.grpcweb;

import com.google.inject.Singleton;
import io.grpc.Channel;
import io.grpc.ClientInterceptors;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;

/**
 * TODO: Manage the connection pool to talk to the grpc-service
 */
@Singleton
class GrpcServiceConnectionManager {
  private final int mGrpcPortNum;

  GrpcServiceConnectionManager(int grpcPortNum) {
    mGrpcPortNum  = grpcPortNum;
  }

  private ManagedChannel getManagedChannel() {
    // TODO: Manage a connection pool.
    return ManagedChannelBuilder.forAddress("localhost", mGrpcPortNum)
        .usePlaintext()
        .build();
  }

  Channel getChannelWithClientInterceptor(GrpcWebClientInterceptor interceptor) {
    return ClientInterceptors.intercept(getManagedChannel(), interceptor);
  }
}
