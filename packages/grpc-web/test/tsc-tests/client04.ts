/**
 *
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
import * as grpcWeb from 'grpc-web';

import {EchoRequest, EchoResponse} from './generated/echo_pb';
import {EchoServicePromiseClient} from './generated/echo_grpc_web_pb';

// The UnaryInterceptor interface is for the promise-based client.
class MyUnaryInterceptor implements grpcWeb.UnaryInterceptor<
  EchoRequest, EchoResponse> {
    intercept(request: grpcWeb.Request<EchoRequest, EchoResponse>,
              invoker: (request: grpcWeb.Request<EchoRequest, EchoResponse>) =>
      Promise<grpcWeb.UnaryResponse<EchoRequest, EchoResponse>>) {
      const reqMsg = request.getRequestMessage();
      reqMsg.setMessage('[-out-]' + reqMsg.getMessage());
      return invoker(request).then((response: grpcWeb.UnaryResponse<
        EchoRequest, EchoResponse>) => {
          let result = '<-InitialMetadata->';
          let initialMetadata = response.getMetadata();
          for (let i in initialMetadata) {
            result += i + ': ' + initialMetadata[i];
          }
          result += '<-TrailingMetadata->';
          let trailingMetadata = response.getStatus().metadata;
          for (let i in trailingMetadata) {
            result += i + ': ' + trailingMetadata[i];
          }
          const responseMsg = response.getResponseMessage();
          result += '[-in-]' + responseMsg.getMessage();
          responseMsg.setMessage(result);
          return response;
        });
    }
  }

var opts = {'unaryInterceptors' : [new MyUnaryInterceptor()]};

const echoService = new EchoServicePromiseClient('http://localhost:8080',
                                                 null, opts);

export {echoService, EchoRequest}
