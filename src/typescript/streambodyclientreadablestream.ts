/**
 * @fileoverview gRPC web client Readable Stream
 *
 * This class is being returned after a gRPC streaming call has been
 * started. This class provides functionality for user to operates on
 * the stream, e.g. set onData callback, etc.
 *
 * This wraps the underlying goog.net.streams.NodeReadableStream
 */

import {Status as GoogleRpcStatus} from './generated/status_pb';
import {ClientReadableStream} from './clientreadablestream';
import * as assert from 'assert';
import { XhrIo, ErrorCode,listen, EventType, NodeReadableStream  } from '@closure-net/blob';
import {GenericTransportInterface} from './generictransportinterface';
import {Metadata} from './metadata';
import {RpcError} from './rpcerror';
import {Status} from './status';
import {StatusCode, fromHttpStatus} from './statuscode';

/**
 * A stream that the client can read from. Used for calls that are streaming
 * from the server side.
 */
export class StreamBodyClientReadableStream<RESPONSE>
  implements ClientReadableStream<RESPONSE>
{
  /** The XHR Node Readable Stream */
  private readonly xhrNodeReadableStream?: NodeReadableStream | null;

  /** The deserialize function for the proto */
  private readonly grpcResponseDeserializeFn: (p1: unknown) => RESPONSE;

  /** The XhrIo object */
  private readonly xhr?: XhrIo | null;

  /** The list of data callback */
  private readonly onDataCallbacks: Array<(p1: RESPONSE) => void> = [];

  /** The list of metadata callbacks */
  private readonly onMetadataCallbacks: Array<(p1: Metadata) => void> = [];

  /** The list of status callback */
  private readonly onStatusCallbacks: Array<(p1: Status) => void> = [];

  /** The list of stream end callback */
  private readonly onEndCallbacks: Array<() => void> = [];

  /** The list of error callback */
  private readonly onErrorCallbacks: Array<(p1: RpcError) => void> = [];

  constructor(
    genericTransportInterface: GenericTransportInterface,
    responseDeserializeFn: (p1: unknown) => RESPONSE,
    private readonly isBinary: boolean,
  ) {
    this.xhrNodeReadableStream = genericTransportInterface.nodeReadableStream;

    this.grpcResponseDeserializeFn = responseDeserializeFn;

    this.xhr = genericTransportInterface.xhr;

    if (this.xhrNodeReadableStream) {
      this.setStreamCallback();
    }
  }

  /**
   * Set up the callback functions for unary calls.
   * @param base64Encoded True if 'X-Goog-Encode-Response-If-Executable' is 'base64' in request headers.
   */
  setUnaryCallback(base64Encoded: boolean) {
    // Preserves the stack trace up to this point and appends it to the generic
    // stack track in the callback should there be an error.
    const asyncStack = new AsyncStack();

    listen(this.xhr as XhrIo, EventType.COMPLETE, (e: unknown) => {
      if (this.xhr!.isSuccess()) {
        let response;
        if (this.isBinary) {
          response = this.decodeBinaryResponse(base64Encoded);
        } else {
          response = this.decodeJspbResponse(base64Encoded);
        }

        let responseMessage;
        try {
          responseMessage = this.grpcResponseDeserializeFn(response);
        } catch (e) {
          this.sendErrorCallbacks(
            appendAsyncStack(
              new RpcError(
                StatusCode.INTERNAL,
                `Error when deserializing response data; error: ${e}` +
                  `, response: ${response}`,
              ),
              asyncStack,
            ),
          );
          return;
        }

        const grpcStatus = fromHttpStatus(this.xhr!.getStatus());
        this.sendMetadataCallbacks(this.readHeaders());
        if (grpcStatus === StatusCode.OK) {
          this.sendDataCallbacks(responseMessage);
        } else {
          this.sendErrorCallbacks(
            appendAsyncStack(
              new RpcError(
                grpcStatus,
                'Xhr succeeded but the status code is not 200',
              ),
              asyncStack,
            ),
          );
        }
      } else {
        let rawResponse;
        if (this.isBinary) {
          const xhrResponse = this.xhr!.getResponse();
          if (xhrResponse) {
            rawResponse = new Uint8Array(xhrResponse as ArrayBuffer);
          }
        } else {
          rawResponse = this.xhr!.getResponseText();
        }

        let code = StatusCode.UNKNOWN;
        let message;
        let metadata;
        const responseHeaders = this.readHeaders();
        if (rawResponse) {
          const status = this.parseRpcStatus(rawResponse);
          code = status.code as StatusCode;
          message = status.details;
          metadata = status.metadata;
        } else {
          code = StatusCode.UNKNOWN;
          message =
            `Rpc failed due to xhr error. uri: ${this.xhr!.getLastUri()}, ` +
            `error code: ${this.xhr!.getLastErrorCode()}, ` +
            `error: ${this.xhr!.getLastError()}`;
          metadata = responseHeaders;
        }
        this.sendMetadataCallbacks(responseHeaders);
        this.sendErrorCallbacks(
          appendAsyncStack(new RpcError(code, message, metadata), asyncStack),
        );
      }
    });
  }

  private setStreamCallback() {
    // Add the callback to the underlying stream
    // tslint:disable-next-line:no-any
    this.xhrNodeReadableStream!.on('data', (data: any) => {
      if ('1' in data!) {
        const messageBody = data['1'];
        let response;
        try {
          response = this.grpcResponseDeserializeFn(messageBody);
        } catch (e) {
          this.sendErrorCallbacks(
            new RpcError(
              StatusCode.INTERNAL,
              `Error when deserializing response data; error: ${e}` +
                `, response: ${messageBody}`,
            ),
          );
        }
        if (response) {
          this.sendDataCallbacks(response);
        }
      }
      if ('2' in data!) {
        const status = this.parseRpcStatus(data['2'] as string | Uint8Array);
        this.sendStatusCallbacks(status);
      }
    });

    this.xhrNodeReadableStream!.on('end', () => {
      this.sendMetadataCallbacks(this.readHeaders());
      this.sendEndCallbacks();
    });

    this.xhrNodeReadableStream!.on('error', () => {
      if (this.onErrorCallbacks.length === 0) {
        return;
      }
      let lastErrorCode = this.xhr!.getLastErrorCode();
      if (lastErrorCode === ErrorCode.NO_ERROR && !(this.xhr as any).isSuccess()) {
        // The lastErrorCode on the XHR isn't useful in this case, but the XHR
        // status is. Full details about the failure should be available in the
        // status handler.
        lastErrorCode = ErrorCode.HTTP_ERROR;
      }

      let grpcStatusCode;
      let xhrStatusCode = -1;
      switch (lastErrorCode) {
        case ErrorCode.NO_ERROR:
          grpcStatusCode = StatusCode.UNKNOWN;
          break;
        case ErrorCode.ABORT:
          grpcStatusCode = StatusCode.ABORTED;
          break;
        case ErrorCode.TIMEOUT:
          grpcStatusCode = StatusCode.DEADLINE_EXCEEDED;
          break;
        case ErrorCode.HTTP_ERROR:
          xhrStatusCode = this.xhr!.getStatus();
          grpcStatusCode = fromHttpStatus(xhrStatusCode);
          break;
        default:
          grpcStatusCode = StatusCode.UNAVAILABLE;
      }

      this.sendMetadataCallbacks(this.readHeaders());

      // TODO(armiller): get the message from the response?
      // GoogleRpcStatus.deserialize(rawResponse).getMessage()?
      // Perhaps do the same status logic as in on('data') above?
      let errorMessage =
        ErrorCode.getDebugMessage(lastErrorCode) +
        ', error: ' +
        this.xhr!.getLastError();
      if (xhrStatusCode !== -1) {
        errorMessage += `, http status code: ${xhrStatusCode}`;
      }
      this.sendErrorCallbacks(new RpcError(grpcStatusCode, errorMessage));
    });
  }

  private decodeJspbResponse(base64Encoded: boolean): string {
    // If the response is serialized as Base64 (for example if the
    // X-Goog-Encode-Response-If-Executable header is in effect), decode it
    // before passing it to the deserializer.
    let responseText = this.xhr!.getResponseText();
    if (
      base64Encoded &&
      this.xhr!.getResponseHeaders()['Content-Type'] === 'text/plain'
    ) {
      if (!atob) {
        throw new Error('Cannot decode Base64 response');
      }
      responseText = atob(responseText);
    }
    return responseText;
  }

  private decodeBinaryResponse(
    base64Encoded: boolean,
  ): string | ArrayBuffer | null {
    if (base64Encoded && this.xhr!.getStreamingResponseHeader('X-Goog-Safety-Encoding') === 'base64') {
      const xhrResponse = this.xhr!.getResponse() as ArrayBuffer | null;
      if (!xhrResponse) return null;
      // Convert the response's ArrayBuffer to a string, which should
      // be a base64 encoded string.
      const bytes = new Uint8Array(xhrResponse);
      let byteSource = '';
      for (let i = 0; i < bytes.length; i++) {
        byteSource += String.fromCharCode(bytes[i]);
      }
      return byteSource;
    } else {
      return this.xhr!.getResponse() as ArrayBuffer | null;
    }
  }

  private readHeaders(): Metadata {
    const initialMetadata: Metadata = {};
    const responseHeaders = this.xhr!.getResponseHeaders();
    Object.keys(responseHeaders).forEach((header) => {
      initialMetadata[header] = responseHeaders[header];
    });
    return initialMetadata;
  }

  /**
   * @param data Data returned from the underlying stream.
   * @return The Rpc Status details.
   */
  private parseRpcStatus(data: Uint8Array | string): Status {
    let code = StatusCode.UNKNOWN;
    let message;
    const metadata: Metadata = {};
    try {
      let rpcStatus;
      if (this.isBinary) {
        if (data instanceof Uint8Array) {
          rpcStatus = GoogleRpcStatus.deserializeBinary(data);
        }
      } else {
        assert.ok(
          typeof data === 'string',
          'RPC status must be string in gRPC-Web jspb mode.',
        );
        // tslint:disable-next-line:no-any
        rpcStatus = (GoogleRpcStatus as any).deserialize(data as string);
      }
      code = rpcStatus.getCode();
      message = rpcStatus.getMessage();
      if (rpcStatus.getDetailsList().length) {
        metadata['grpc-web-status-details-bin'] = data as string;
      }
    } catch (e: unknown) {
      // 404s may be accompanied by a GoogleRpcStatus. If they are not,
      // the generic message will fail to deserialize because it is not a
      // status.
      if (this.xhr && this.xhr.getStatus() === 404) {
        code = StatusCode.NOT_FOUND;
        message = 'Not Found: ' + this.xhr!.getLastUri();
      } else {
        code = StatusCode.UNAVAILABLE;
        message = `Unable to parse RpcStatus: ${e}`;
      }
    }
    const status: Status = {code, details: message, metadata};
    return status;
  }

  // tslint:disable-next-line:no-any
  on(eventType: string, callback: (...args: any[]) => void) {
    // TODO(stanleycheung): change eventType to @enum type
    if (eventType === 'data') {
      this.onDataCallbacks.push(callback);
    } else if (eventType === 'metadata') {
      this.onMetadataCallbacks.push(callback);
    } else if (eventType === 'status') {
      this.onStatusCallbacks.push(callback);
    } else if (eventType === 'end') {
      this.onEndCallbacks.push(callback);
    } else if (eventType === 'error') {
      this.onErrorCallbacks.push(callback);
    }
    return this;
  }

  /**
   * @param callbacks the internal list of callbacks
   * @param callback the callback to remove
   */
  private removeListenerFromCallbacks(
    // tslint:disable-next-line:no-any
    callbacks: Array<(...args: any[]) => void>,
    // tslint:disable-next-line:no-any
    callback: (...args: any[]) => void,
  ) {
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  // tslint:disable-next-line:no-any
  removeListener(eventType: string, callback: (...args: any[]) => void) {
    if (eventType === 'data') {
      this.removeListenerFromCallbacks(this.onDataCallbacks, callback);
    } else if (eventType === 'metadata') {
      this.removeListenerFromCallbacks(this.onMetadataCallbacks, callback);
    } else if (eventType === 'status') {
      this.removeListenerFromCallbacks(this.onStatusCallbacks, callback);
    } else if (eventType === 'end') {
      this.removeListenerFromCallbacks(this.onEndCallbacks, callback);
    } else if (eventType === 'error') {
      this.removeListenerFromCallbacks(this.onErrorCallbacks, callback);
    }
    return this;
  }

  cancel() {
    this.xhr!.abort();
  }

  /** @param data The data to send back */
  private sendDataCallbacks(data: RESPONSE) {
    for (let i = 0; i < this.onDataCallbacks.length; i++) {
      this.onDataCallbacks[i](data);
    }
  }

  /** @param metadata The metadata to send back */
  private sendMetadataCallbacks(metadata: Metadata) {
    for (let i = 0; i < this.onMetadataCallbacks.length; i++) {
      this.onMetadataCallbacks[i](metadata);
    }
  }

  /** @param status The status to send back */
  private sendStatusCallbacks(status: Status) {
    for (let i = 0; i < this.onStatusCallbacks.length; i++) {
      this.onStatusCallbacks[i](status);
    }
  }

  /** @param error The error to send back */
  private sendErrorCallbacks(error: RpcError) {
    for (let i = 0; i < this.onErrorCallbacks.length; i++) {
      this.onErrorCallbacks[i](error);
    }
  }

  private sendEndCallbacks() {
    for (let i = 0; i < this.onEndCallbacks.length; i++) {
      this.onEndCallbacks[i]();
    }
  }
}

class AsyncStack extends Error {
  override name = 'AsyncStack';

  constructor() {
    super();
    // See go/typescript-extending-builtins
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

function appendAsyncStack(
  rpcError: RpcError,
  asyncStack: AsyncStack,
): RpcError {
  if (asyncStack.stack) {
    rpcError.stack += '\n' + asyncStack.stack;
  }
  return rpcError;
}
