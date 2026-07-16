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
 * @fileoverview gRPC web client Readable Stream
 *
 * This class is being returned after a gRPC streaming call has been
 * started. This class provides functionality for user to operates on
 * the stream, e.g. set onData callback, etc.
 *
 * This wraps the underlying goog.net.streams.NodeReadableStream
 */

import { 
  encodeByteArray, 
  decodeStringToUint8Array, 
  listen, 
  ErrorCode,
  EventType, 
  XhrIo, 
  startsWith 
} from '@closure-net/blob';  
import {ClientReadableStream} from './clientreadablestream';
import {GrpcWebStreamParser} from './grpcwebstreamparser';
import {Metadata} from './metadata';
import {RpcError} from './rpcerror';
import {Status} from './status';
import {fromHttpStatus, StatusCode} from './statuscode';

import {GenericTransportInterface} from './generictransportinterface';

const GRPC_STATUS = 'grpc-status';
const GRPC_STATUS_MESSAGE = 'grpc-message';

const EXCLUDED_RESPONSE_HEADERS: string[] = [
  'content-type',
  GRPC_STATUS,
  GRPC_STATUS_MESSAGE,
];

type Listener<T> = (value: T) => unknown;
type EndListener = (...args: unknown[]) => unknown;

/**
 * A stream that the client can read from. Used for calls that are streaming
 * from the server side.
 * @template RESPONSE
 * @final
 * @unrestricted
 */
export class GrpcWebClientReadableStream<RESPONSE>
  implements ClientReadableStream<RESPONSE>
{
  /**
   * The XhrIo object
   */
  private readonly xhr: XhrIo | null;

  /**
   * The deserialize function for the proto
   */
  private responseDeserializeFn: ((p1: unknown) => RESPONSE) | null = null;

  /**
   * The list of data callbacks
   */
  private readonly onDataCallbacks: Array<Listener<RESPONSE>> = [];

  /**
   * The list of status callbacks
   */
  private readonly onStatusCallbacks: Array<Listener<Status>> = [];

  /**
   * The list of metadata callbacks
   */
  private readonly onMetadataCallbacks: Array<Listener<Metadata>> = [];

  /**
   * The list of error callbacks
   */
  private readonly onErrorCallbacks: Array<Listener<RpcError>> = [];

  /**
   * The list of stream end callbacks
   */
  private readonly onEndCallbacks: EndListener[] = [];

  /**
   * Whether the stream has been aborted
   */
  private aborted = false;

  /**
   * @param genericTransportInterface The
   *   GenericTransportInterface
   */
  constructor(genericTransportInterface: GenericTransportInterface) {
    this.xhr = genericTransportInterface.xhr as XhrIo | null;

    const parser = new GrpcWebStreamParser();
    let pos = 0;

    listen(this.xhr!, EventType.READY_STATE_CHANGE, (e: any) => {
      let contentType = this.xhr!.getStreamingResponseHeader('Content-Type');
      if (!contentType) {
        return;
      }
      
      contentType = contentType.toLowerCase();
      
      let byteSource;
      if (startsWith(contentType, 'application/grpc-web-text')) {
        // Ensure responseText is not null
        const responseText = this.xhr!.getResponseText() || '';
        const newPos = responseText.length - (responseText.length % 4);
        const newData = responseText.substring(pos, newPos);
        if (newData.length === 0) {
          return;
        }
        pos = newPos;
        byteSource = decodeStringToUint8Array(newData);
      } else if (startsWith(contentType, 'application/grpc')) {
        byteSource = new Uint8Array(this.xhr!.getResponse() as ArrayBuffer);
      } else {
        this.handleError(
          new RpcError(StatusCode.UNKNOWN, 'Unknown Content-type received.'),
        );
        return;
      }

      let messages = null;
      try {
        messages = parser.parse(byteSource);
      } catch (err) {
        this.handleError(
          new RpcError(StatusCode.UNKNOWN, 'Error in parsing response body'),
        );
      }
      if (messages) {
        for (let i = 0; i < messages.length; i++) {
          const message = messages[i] as {[key: number]: Uint8Array | number[]};
          if (message[GrpcWebStreamParser.FrameType.DATA] !== undefined) {
            const data = message[GrpcWebStreamParser.FrameType.DATA];
            if (data) {
              let isResponseDeserialized = false;
              let response;
              try {
                response = this.responseDeserializeFn!(data);
                isResponseDeserialized = true;
              } catch (err) {
                this.handleError(
                  new RpcError(
                    StatusCode.INTERNAL,
                    `Error when deserializing response data; error: ${err}` +
                      `, response: ${response}`,
                  ),
                );
              }
              if (isResponseDeserialized) {
                this.sendDataCallbacks(response!);
              }
            }
          }
          if (message[GrpcWebStreamParser.FrameType.TRAILER] !== undefined) {
            const trailerData = message[GrpcWebStreamParser.FrameType.TRAILER];
            if (trailerData && trailerData.length > 0) {
              let trailerString = '';
              for (let pos = 0; pos < trailerData.length; pos++) {
                trailerString += String.fromCharCode(
                  trailerData[pos] as number,
                );
              }
              const trailers = this.parseHttp1Headers(trailerString);
              let grpcStatusCode = StatusCode.OK;
              let grpcStatusMessage = '';
              if (GRPC_STATUS in trailers) {
                grpcStatusCode = Number(trailers[GRPC_STATUS]) as number;
                delete trailers[GRPC_STATUS];
              }
              if (GRPC_STATUS_MESSAGE in trailers) {
                grpcStatusMessage = trailers[GRPC_STATUS_MESSAGE];
                delete trailers[GRPC_STATUS_MESSAGE];
              }
              this.handleError(
                new RpcError(grpcStatusCode, grpcStatusMessage, trailers),
              );
            }
          }
        }
      }
    });
    
    listen(this.xhr!, EventType.COMPLETE, (e: any) => {
      const lastErrorCode = this.xhr!.getLastErrorCode();
      let grpcStatusCode = StatusCode.UNKNOWN;
      let grpcStatusMessage = '';
      const initialMetadata: Metadata = {};

      // Get response headers with lower case keys.
      const rawResponseHeaders = this.xhr!.getResponseHeaders();
      const responseHeaders: {[key: string]: string} = {};
      for (const key in rawResponseHeaders) {
        if (rawResponseHeaders.hasOwnProperty(key)) {
          responseHeaders[key.toLowerCase()] = rawResponseHeaders[key];
        }
      }

      Object.keys(responseHeaders).forEach((header) => {
        if (!EXCLUDED_RESPONSE_HEADERS.includes(header)) {
          initialMetadata[header] = responseHeaders[header];
        }
      });
      this.sendMetadataCallbacks(initialMetadata);

      // There's an XHR level error
      let xhrStatusCode = -1;
      if (lastErrorCode !== ErrorCode.NO_ERROR) {
        switch (lastErrorCode) {
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
        if (grpcStatusCode === StatusCode.ABORTED && this.aborted) {
          return;
        }
        let errorMessage = ErrorCode.getDebugMessage(lastErrorCode);
        if (xhrStatusCode !== -1) {
          errorMessage += `, http status code: ${xhrStatusCode}`;
        }

        this.handleError(new RpcError(grpcStatusCode, errorMessage));
        return;
      }

      let errorEmitted = false;

      // Check whethere there are grpc specific response headers
      if (GRPC_STATUS in responseHeaders) {
        grpcStatusCode = Number(responseHeaders[GRPC_STATUS]) as number;
        if (GRPC_STATUS_MESSAGE in responseHeaders) {
          grpcStatusMessage = responseHeaders[GRPC_STATUS_MESSAGE];
        }
        if (grpcStatusCode !== StatusCode.OK) {
          this.handleError(
            new RpcError(
              grpcStatusCode,
              grpcStatusMessage || '',
              responseHeaders,
            ),
          );
          errorEmitted = true;
        }
      }

      if (!errorEmitted) {
        this.sendEndCallbacks();
      }
    });
  }

  /**
   * @export
   */
  on(
    eventType: 'data' | 'status' | 'metadata' | 'error' | 'end',
    callback:
      | Listener<RESPONSE>
      | Listener<Status>
      | Listener<Metadata>
      | Listener<RpcError>
      | EndListener,
  ): ClientReadableStream<RESPONSE> {
    switch (eventType) {
      case 'data':
        this.onDataCallbacks.push(callback as Listener<RESPONSE>);
        break;
      case 'status':
        this.onStatusCallbacks.push(callback as Listener<Status>);
        break;
      case 'metadata':
        this.onMetadataCallbacks.push(callback as Listener<Metadata>);
        break;
      case 'error':
        this.onErrorCallbacks.push(callback as Listener<RpcError>);
        break;
      case 'end':
        this.onEndCallbacks.push(callback as EndListener);
        break;
      default:
        // Should not happen, as eventType is constrained by the overloads.
        throw new Error(`Unknown event type: ${eventType}`);
    }
    return this;
  }

  /**
   * @param callbacks the internal list of callbacks
   * @param callback the callback to remove
   */
  private removeCallback<T>(callbacks: T[], callback: T): void {
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  /**
   * @export
   */
  removeListener(
    eventType: 'data' | 'status' | 'metadata' | 'error' | 'end',
    callback:
      | Listener<RESPONSE>
      | Listener<Status>
      | Listener<Metadata>
      | Listener<RpcError>
      | EndListener,
  ): ClientReadableStream<RESPONSE> {
    switch (eventType) {
      case 'data':
        this.removeCallback(
          this.onDataCallbacks,
          callback as Listener<RESPONSE>,
        );
        break;
      case 'status':
        this.removeCallback(
          this.onStatusCallbacks,
          callback as Listener<Status>,
        );
        break;
      case 'metadata':
        this.removeCallback(
          this.onMetadataCallbacks,
          callback as Listener<Metadata>,
        );
        break;
      case 'error':
        this.removeCallback(
          this.onErrorCallbacks,
          callback as Listener<RpcError>,
        );
        break;
      case 'end':
        this.removeCallback(this.onEndCallbacks, callback as EndListener);
        break;
      default:
        // Should not happen, as eventType is constrained by the overloads.
        throw new Error(`Unknown event type: ${eventType}`);
    }
    return this;
  }

  /**
   * Register a callbackl to parse the response
   *
   * @param responseDeserializeFn The deserialize
   *   function for the proto
   */
  setResponseDeserializeFn(responseDeserializeFn: (p1: unknown) => RESPONSE) {
    this.responseDeserializeFn = responseDeserializeFn;
  }

  /**
   * @export
   */
  cancel(): void {
    this.aborted = true;
    this.xhr!.abort();
  }

  /**
   * Parse HTTP headers
   *
   * @param str The raw http header string
   * @return The header:value pairs
   */
  private parseHttp1Headers(str: string): {[key: string]: string} {
    const chunks = str.trim().split('\r\n');
    const headers: {[key: string]: string} = {};
    for (let i = 0; i < chunks.length; i++) {
      const pos = chunks[i].indexOf(':');
      headers[chunks[i].substring(0, pos).trim()] = chunks[i]
        .substring(pos + 1)
        .trim();
    }
    return headers;
  }

  /**
   * A central place to handle errors
   *
   * @param error The error object
   */
  private handleError(error: RpcError) {
    if (error.code !== StatusCode.OK) {
      this.sendErrorCallbacks(
        new RpcError(
          error.code,
          decodeURIComponent(error.message || ''),
          error.metadata,
        ),
      );
    }
    this.sendStatusCallbacks({
      code: error.code,
      details: decodeURIComponent(error.message || ''),
      metadata: error.metadata,
    } as Status);
  }

  /**
   * @param data The data to send back
   */
  private sendDataCallbacks(data: RESPONSE) {
    for (let i = 0; i < this.onDataCallbacks.length; i++) {
      this.onDataCallbacks[i](data);
    }
  }

  /**
   * @param status The status to send back
   */
  private sendStatusCallbacks(status: Status) {
    for (let i = 0; i < this.onStatusCallbacks.length; i++) {
      this.onStatusCallbacks[i](status);
    }
  }

  /**
   * @param metadata The metadata to send back
   */
  private sendMetadataCallbacks(metadata: Metadata) {
    for (let i = 0; i < this.onMetadataCallbacks.length; i++) {
      this.onMetadataCallbacks[i](metadata);
    }
  }

  /**
   * @param error The error to send back
   */
  private sendErrorCallbacks(error: RpcError) {
    for (let i = 0; i < this.onErrorCallbacks.length; i++) {
      this.onErrorCallbacks[i](error);
    }
  }

  /**
   */
  private sendEndCallbacks() {
    for (let i = 0; i < this.onEndCallbacks.length; i++) {
      this.onEndCallbacks[i]();
    }
  }
}
