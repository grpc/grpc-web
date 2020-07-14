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

const echoService = new EchoServicePromiseClient(
  'http://localhost:8080', null, null);

let req = new EchoRequest();
req.setMessage('aaa');

// this test tries to make sure that these types are as accurate as possible

let p1 : Promise<EchoResponse> = echoService.echo(req, {});

// why does the .then() add this extra 'void' type to the returned Promise?
let p2 : Promise<void | EchoResponse> = p1.then((response: EchoResponse) => {
});
