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

import {EchoRequest, EchoResponse,
        ServerStreamingEchoRequest,
        ServerStreamingEchoResponse} from './generated/echo_pb';
import {EchoServiceClient} from './generated/echo_grpc_web_pb';

const echoService = new EchoServiceClient('http://localhost:8080', null, null);

let req = new EchoRequest();
req.setMessage('aaa');

// this test tries to make sure that these types are as accurate as possible

let call1 : grpcWeb.ClientReadableStream<EchoResponse> =
  echoService.echo(req, {}, (err: grpcWeb.Error,
                             response: EchoResponse) => {
                             });

call1
  .on('status', (status: grpcWeb.Status) => {
  })
  .on('metadata', (metadata: grpcWeb.Metadata) => {
  });

let call2 : grpcWeb.ClientReadableStream<ServerStreamingEchoResponse> =
  echoService.serverStreamingEcho(new ServerStreamingEchoRequest(), {});

call2
  .on('data', (response: ServerStreamingEchoResponse) => {
  })
  .on('error', (error: grpcWeb.Error) => {
  });
