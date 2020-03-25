import { Component } from '@angular/core';
import { EchoService, ECHO_SERVICE_CONFIG } from './shared/echo.service.pb';
import { EchoRequest, ServerStreamingEchoRequest } from './shared/echo_pb';
import { delay } from 'rxjs/operators';
import { Subscription } from 'rxjs';

export interface Message {
  text?: string;
  isRequest?: boolean;
}

const INTERVAL = 500;  // ms
const MAX_STREAM_MESSAGES = 50;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass'],
  providers: [
    EchoService,
    {
      provide: ECHO_SERVICE_CONFIG,
      useValue: { hostname: 'http://localhost:8080' }
    },
  ]
})
export class AppComponent {
  stream: Subscription;

  constructor(private echoService: EchoService) { }

  messages: Message[] = [];

  onSend(message: string) {
    const msg = message.trim();
    if (!msg) return;

    if (msg.indexOf(' ') > 0) {
      const count = msg.substr(0, msg.indexOf(' '));
      if (/^\d+$/.test(count)) {
        this.repeatEcho(msg.substr(msg.indexOf(' ') + 1), Number(count));
      } else {
        this.echo(msg);
      }
    } else if (msg === 'error') {
      this.echoError();
    } else if (msg === 'cancel') {
      this.cancel();
    } else {
      this.echo(msg);
    }
  }

  private echo(message: string) {
    this.addLeftMessage(message);
    const request = new EchoRequest();
    request.setMessage(message);

    this.echoService.echo(request, { 'custom-header-1': 'value1' })
      .pipe(delay(INTERVAL))
      .subscribe(
        response => this.addRightMessage(response.getMessage()),
        error => this.handleError(error),
      );
  }

  private repeatEcho(message: string, count: number) {
    this.addLeftMessage(message);
    if (count > MAX_STREAM_MESSAGES) {
      count = MAX_STREAM_MESSAGES;
    }
    const request = new ServerStreamingEchoRequest();
    request.setMessage(message);
    request.setMessageCount(count);
    request.setMessageInterval(INTERVAL);

    this.stream = this.echoService.serverStreamingEcho(
      request, { 'custom-header-1': 'value1' }).subscribe(
        response => this.addRightMessage(response.getMessage()),
        error => this.handleError(error),
      );
  }

  private echoError() {
    this.addLeftMessage('Error');
    const request = new EchoRequest();
    request.setMessage('error')
    this.echoService.echoAbort(request, {}).subscribe(
      response => this.addRightMessage(response.getMessage()),
      error => this.handleError(error),
    );
  }

  private cancel() {
    this.addLeftMessage('Cancel');
    if (this.stream) {
      this.stream.unsubscribe();
    }
  }

  private handleError(error) {
    this.addRightMessage(
      'Error code: ' + error.code + ' "' + decodeURI(error.message) + '"');
  }

  private addLeftMessage(message: string) {
    // Empty message used to skip right tile on the mat-grid-list.
    const newMessage: Message[] = [{ text: message, isRequest: true }, {}];
    this.messages = newMessage.concat(this.messages);
  }

  private addRightMessage(message: string) {
    // Empty message used to skip left tile on the mat-grid-list.
    const newMessage: Message[] = [{}, { text: message }];
    this.messages = newMessage.concat(this.messages);
  }
}
