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
import * as $ from 'jquery';

// Uncomment either one of the following:
// Option 1: import_style=commonjs+dts
import {EchoServiceClient} from './echo_grpc_web_pb';

// Option 2: import_style=typescript
// import {EchoServiceClient} from './EchoServiceClientPb';

import {EchoRequest, EchoResponse, ServerStreamingEchoRequest, ServerStreamingEchoResponse} from './echo_pb';

class EchoApp {
  static readonly INTERVAL = 500;  // ms
  static readonly MAX_STREAM_MESSAGES = 50;
  echoService_: EchoServiceClient;

  constructor(echoService: EchoServiceClient) {
    this.echoService_ = echoService;
  }

  static addMessage(message: string, cssClass: string) {
    $('#first').after($('<div/>').addClass('row').append($('<h2/>').append(
        $('<span/>').addClass('label ' + cssClass).text(message))));
  }

  static addLeftMessage(message: string) {
    this.addMessage(message, 'label-primary pull-left');
  }

  static addRightMessage(message: string) {
    this.addMessage(message, 'label-default pull-right');
  }

  echo(msg: string) {
    EchoApp.addLeftMessage(msg);
    const request = new EchoRequest();
    request.setMessage(msg);
    const call = this.echoService_.echo(
        request, {'custom-header-1': 'value1'},
        (err: grpcWeb.Error, response: EchoResponse) => {
          if (err) {
            if (err.code !== grpcWeb.StatusCode.OK) {
              EchoApp.addRightMessage(
                  'Error code: ' + err.code + ' "' + err.message + '"');
            }
          } else {
            setTimeout(() => {
              EchoApp.addRightMessage(response.getMessage());
            }, EchoApp.INTERVAL);
          }
        });
    call.on('status', (status: grpcWeb.Status) => {
      if (status.metadata) {
        console.log('Received metadata');
        console.log(status.metadata);
      }
    });
  }

  echoError(msg: string) {
    EchoApp.addLeftMessage(msg);
    const request = new EchoRequest();
    request.setMessage(msg);
    this.echoService_.echoAbort(
        request, {}, (err: grpcWeb.Error, response: EchoResponse) => {
          if (err) {
            if (err.code !== grpcWeb.StatusCode.OK) {
              EchoApp.addRightMessage(
                  'Error code: ' + err.code + ' "' + err.message + '"');
            }
          }
        });
  }

  repeatEcho(msg: string, count: number) {
    EchoApp.addLeftMessage(msg);
    if (count > EchoApp.MAX_STREAM_MESSAGES) {
      count = EchoApp.MAX_STREAM_MESSAGES;
    }
    const request = new ServerStreamingEchoRequest();
    request.setMessage(msg);
    request.setMessageCount(count);
    request.setMessageInterval(EchoApp.INTERVAL);

    const stream = this.echoService_.serverStreamingEcho(
        request, {'custom-header-1': 'value1'});
    const self = this;
    stream.on('data', (response: ServerStreamingEchoResponse) => {
      EchoApp.addRightMessage(response.getMessage());
    });
    stream.on('status', (status: grpcWeb.Status) => {
      if (status.metadata) {
        console.log('Received metadata');
        console.log(status.metadata);
      }
    });
    stream.on('error', (err: grpcWeb.Error) => {
      EchoApp.addRightMessage(
          'Error code: ' + err.code + ' "' + err.message + '"');
    });
    stream.on('end', () => {
      console.log('stream end signal received');
    });
  }

  send(e: {}) {
    const _msg: string = $('#msg').val() as string;
    const msg = _msg.trim();
    $('#msg').val('');  // clear the text box
    if (!msg) return false;

    if (msg.indexOf(' ') > 0) {
      const count = msg.substr(0, msg.indexOf(' '));
      if (/^\d+$/.test(count)) {
        this.repeatEcho(msg.substr(msg.indexOf(' ') + 1), Number(count));
      } else if (count === 'err') {
        this.echoError(msg.substr(msg.indexOf(' ') + 1));
      } else {
        this.echo(msg);
      }
    } else {
      this.echo(msg);
    }
  }

  load() {
    const self = this;
    $(document).ready(() => {
      // event handlers
      $('#send').click(self.send.bind(self));
      $('#msg').keyup((e) => {
        if (e.keyCode === 13) self.send(e);  // enter key
        return false;
      });

      $('#msg').focus();
    });
  }
}

const echoService = new EchoServiceClient('http://localhost:8080', null, null);

const echoApp = new EchoApp(echoService);
echoApp.load();
