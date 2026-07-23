import {ClientReadableStream} from './clientreadablestream';

/** This class handles ClientReadableStream returned by unary calls. */
export class ClientUnaryCallImpl<RESPONSE>
  implements ClientReadableStream<RESPONSE>
{
  constructor(public stream: ClientReadableStream<RESPONSE>) {}

  on(
    eventType: 'data' | 'error' | 'metadata' | 'status' | 'end',
    callback: (event?: unknown) => void,
  ): ClientReadableStream<RESPONSE> {
    if (eventType === 'data' || eventType === 'error') {
      // unary call responses and errors should be handled by the main
      // (err, resp) => ... callback for 'data' and 'error'
      return this;
    }
    return this.stream.on(eventType, callback);
  }

  removeListener(
    eventType: 'data' | 'error' | 'metadata' | 'status' | 'end',
    callback: (event?: unknown) => void,
  ): ClientReadableStream<RESPONSE> {
    return this.stream.removeListener(eventType, callback);
  }

  cancel(): void {
    this.stream.cancel();
  }
}