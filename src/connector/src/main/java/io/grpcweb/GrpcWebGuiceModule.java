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
package io.grpcweb;

import com.google.inject.AbstractModule;
import com.google.inject.Guice;
import com.google.inject.Injector;

class GrpcWebGuiceModule extends AbstractModule {
  private static Injector sInjector;
  private static int sGrpcPortNum;

  // This method should be called only once.
  static void init(int i) {
    sGrpcPortNum = i;
    sInjector = Guice.createInjector(new GrpcWebGuiceModule());
  }

  static Injector getInjector() {
    return sInjector;
  }

  @Override
  protected void configure() {
    bind(GrpcServiceConnectionManager.class)
        .toInstance(new GrpcServiceConnectionManager(sGrpcPortNum));
  }
}
