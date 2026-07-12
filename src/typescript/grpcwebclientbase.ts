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
 * @fileoverview gRPC browser client library.
 *
 * Base class for gRPC Web JS clients using the application/grpc-web wire
 * format
 */

import { 
  toObject,
  encodeByteArray, 
  decodeStringToUint8Array, 
  setHttpHeadersWithOverwriteParam, 
  HTTP_HEADERS_PARAM_NAME, 
  XhrIo 
} from '@closure-net/blob';; 
import {ClientReadableStream} from './clientreadablestream';
import {GrpcWebClientReadableStream} from './grpcwebclientreadablestream';

import {
  AbstractClientBase,
  getHostname,
  PromiseCallOptions,
} from './abstractclientbase';
import {ClientOptions} from './clientoptions';
import {ClientUnaryCallImpl} from './clientunarycallimpl';
import {StreamInterceptor, UnaryInterceptor} from './interceptor';
import {MethodDescriptor} from './methoddescriptor';
import {Request} from './request';
import {RpcError} from './rpcerror';
import {Status} from './status';
import {StatusCode} from './statuscode';
import {UnaryResponse} from './unaryresponse';
export { MethodDescriptor as MethodInfo } from './methoddescriptor';
  
  
/**
 * Base class for gRPC web client using the application/grpc-web wire format
 */
export class GrpcWebClientBase implements AbstractClientBase {
  private readonly format: string;
  private readonly suppressCorsPreflight: boolean;
  private readonly withCredentials: boolean;
  private readonly streamInterceptors: StreamInterceptor[];
  private readonly unaryInterceptors: UnaryInterceptor[];
  private readonly xhrIo: XhrIo | null;

  constructor(options: ClientOptions = {}, xhrIo?: XhrIo) {
    this.format = options?.format || 'text';
    this.suppressCorsPreflight = options?.suppressCorsPreflight ?? false;
    this.withCredentials = options?.withCredentials ?? false;
    this.streamInterceptors = options?.streamInterceptors || [];
    this.unaryInterceptors = options?.unaryInterceptors || [];

    this.xhrIo = xhrIo || null;
  }

  /**
   * @export
   */
  rpcCall<REQUEST, RESPONSE>(
    method: string,
    requestMessage: REQUEST,
    metadata: {[key: string]: string},
    methodDescriptor: MethodDescriptor<REQUEST, RESPONSE>,
    // TODO(vuha): Replace `any` with `RESPONSE | undefined` to align with grpc-web API.
    // Currently using `any` because existing call sites rely on loose typing
    // and are not yet compatible with stricter types.
    // Follow-up: update call sites to properly handle `undefined` and migrate this type.
    // tslint:disable-next-line:no-any
    callback: (a: RpcError | null, b: any) => void,
  ): ClientReadableStream<RESPONSE> {
    const hostname = getHostname(method, methodDescriptor);
    const invoker = GrpcWebClientBase.runStreamInterceptors<REQUEST, RESPONSE>(
      (request) => this.startStream(request, hostname),
      this.streamInterceptors,
    );
    const stream = invoker(
      methodDescriptor.createRequest(requestMessage, metadata),
    );
    GrpcWebClientBase.setCallback(stream, callback);
    return new ClientUnaryCallImpl(stream);
  }

  /**
   * @param method The method to invoke
   * @param requestMessage The request proto
   * @param metadata User defined call metadata
   * @param options Options for the call
   */
  thenableCall<REQUEST, RESPONSE>(
    method: string,
    requestMessage: REQUEST,
    metadata: {[key: string]: string},
    methodDescriptor: MethodDescriptor<REQUEST, RESPONSE>,
    options: PromiseCallOptions = {},
  ): Promise<RESPONSE> {
    const hostname = getHostname(method, methodDescriptor);
    const signal = options?.signal;

    const initialInvoker = (
      request: Request<REQUEST, RESPONSE>,
    ): Promise<UnaryResponse<RESPONSE>> =>
      new Promise((resolve, reject) => {
        if (signal?.aborted) {
          const error = new RpcError(StatusCode.CANCELLED, 'Aborted');
          (error as Error & {cause?: unknown}).cause = signal.reason;
          reject(error);
          return;
        }

        const stream = this.startStream(request, hostname);

        let unaryMetadata!: {[key: string]: string};
        let unaryStatus!: Status;
        let unaryMsg!: RESPONSE;

        GrpcWebClientBase.setUnaryCallback(
          stream,
          (
            error: RpcError | null,
            response: RESPONSE | null,
            status?: Status | null,
            metadata?: {[key: string]: string} | null,
            unaryResponseReceived?: boolean | null,
          ) => {
            if (error) {
              reject(error);
            } else if (unaryResponseReceived) {
              unaryMsg = response!;
            } else if (status) {
              unaryStatus = status;
            } else if (metadata) {
              unaryMetadata = metadata;
            } else {
              resolve(
                request
                  .getMethodDescriptor()
                  .createUnaryResponse(unaryMsg, unaryMetadata, unaryStatus),
              );
            }
          },
        );

        if (signal) {
          signal.addEventListener('abort', () => {
            stream.cancel();
            const error = new RpcError(StatusCode.CANCELLED, 'Aborted');
            (error as Error & {cause?: unknown}).cause = signal.reason;
            reject(error);
          });
        }
      });

    const invoker = GrpcWebClientBase.runUnaryInterceptors<REQUEST, RESPONSE>(
      initialInvoker,
      this.unaryInterceptors,
    );

    const unaryResponse = invoker(
      methodDescriptor.createRequest(requestMessage, metadata),
    );

    return unaryResponse.then((response) => response.getResponseMessage());
  }

  /**
   * @export
   * @param method The method to invoke
   * @param requestMessage The request proto
   * @param metadata User defined call metadata
   * @param methodDescriptor Information
   *     of this RPC method
   * @param options Options for the call
   */
  unaryCall<REQUEST, RESPONSE>(
    method: string,
    requestMessage: REQUEST,
    metadata: {[key: string]: string},
    methodDescriptor: MethodDescriptor<REQUEST, RESPONSE>,
    options?: PromiseCallOptions | null,
  ): Promise<RESPONSE> {
    return this.thenableCall(
      method,
      requestMessage,
      metadata,
      methodDescriptor,
      options ?? {},
    );
  }

  /**
   * @export
   */
  serverStreaming<REQUEST, RESPONSE>(
    method: string,
    requestMessage: REQUEST,
    metadata: {[key: string]: string},
    methodDescriptor: MethodDescriptor<REQUEST, RESPONSE>,
  ): ClientReadableStream<RESPONSE> {
    const hostname = getHostname(method, methodDescriptor);

    const invoker = GrpcWebClientBase.runStreamInterceptors<REQUEST, RESPONSE>(
      (request) => this.startStream(request, hostname),
      this.streamInterceptors,
    );

    return invoker(methodDescriptor.createRequest(requestMessage, metadata));
  }

  private startStream<REQUEST, RESPONSE>(
    request: Request<REQUEST, RESPONSE>,
    hostname: string,
  ): ClientReadableStream<RESPONSE> {
    const methodDescriptor = request.getMethodDescriptor();
    let path = hostname + methodDescriptor.getName();

    const xhr = this.xhrIo ? this.xhrIo : new XhrIo();
    xhr.setWithCredentials(this.withCredentials);

    const genericTransportInterface = {
      xhr,
      nodeReadableStream: null,
    };
    const stream = new GrpcWebClientReadableStream<RESPONSE>(
      genericTransportInterface,
    );
    stream.setResponseDeserializeFn(
      methodDescriptor.getResponseDeserializeFn(),
    );

    const metadata = request.getMetadata();
    for (const key in metadata) {
      if (Object.prototype.hasOwnProperty.call(metadata, key)) {
        xhr.headers.set(key, metadata[key]);
      }
    }
    this.processHeaders(xhr);
    if (this.suppressCorsPreflight) {
      const headerObject = toObject(xhr.headers);
      xhr.headers.clear();
      path = GrpcWebClientBase.setCorsOverride(path, headerObject);
    }

    const requestSerializeFn = methodDescriptor.getRequestSerializeFn();
    const serialized = requestSerializeFn(request.getRequestMessage());
    let payload: Uint8Array | string = this.encodeRequest(serialized);
    if (this.format === 'text') {
      payload = encodeByteArray(payload as Uint8Array);
    } else if (this.format === 'binary') {
      xhr.setResponseType(XhrIo.ResponseType.ARRAY_BUFFER);
    }
    xhr.send(path, 'POST', payload);
    return stream;
  }

  private static setCallback<RESPONSE>(
    stream: ClientReadableStream<RESPONSE>,
    // tslint:disable-next-line:no-any
    callback: (a: RpcError | null, b: any) => void,
  ) {
    let isResponseReceived = false;
    let responseReceived: RESPONSE | undefined = undefined;
    let errorEmitted = false;
    stream.on('data', (response) => {
      isResponseReceived = true;
      responseReceived = response;
    });
    stream.on('error', (error) => {
      if (error.code !== StatusCode.OK && !errorEmitted) {
        errorEmitted = true;
        callback(error, undefined);
      }
    });
    stream.on('status', (status) => {
      if (status.code !== StatusCode.OK && !errorEmitted) {
        errorEmitted = true;
        callback(
          new RpcError(status.code, status.details, status.metadata || {}),
          undefined,
        );
      }
    });
    stream.on('end', () => {
      if (!errorEmitted) {
        if (!isResponseReceived) {
          callback(
            new RpcError(StatusCode.UNKNOWN, 'Incomplete response'),
            undefined,
          );
        } else {
          callback(null, responseReceived);
        }
      }
    });
  }

  private static setUnaryCallback<RESPONSE>(
    stream: ClientReadableStream<RESPONSE>,
    callback: (
      a: RpcError | null,
      // tslint:disable-next-line:no-any
      b: any,
      c?: Status | null,
      d?: {[key: string]: string} | null,
      e?: boolean | null,
    ) => void,
  ) {
    let isResponseReceived = false;
    let responseReceived: RESPONSE | null = null;
    let errorEmitted = false;
    stream.on('data', (response) => {
      isResponseReceived = true;
      responseReceived = response;
    });
    stream.on('error', (error) => {
      if (error.code !== StatusCode.OK && !errorEmitted) {
        errorEmitted = true;
        callback(error, null);
      }
    });
    stream.on('status', (status) => {
      if (status.code !== StatusCode.OK && !errorEmitted) {
        errorEmitted = true;
        const error: RpcError = {
          code: status.code,
          message: status.details,
          metadata: status.metadata || {},
        } as RpcError;
        callback(error, null);
      } else {
        callback(null, null, status);
      }
    });
    stream.on('metadata', (metadata) => {
      callback(null, null, null, metadata);
    });
    stream.on('end', () => {
      if (!errorEmitted) {
        if (!isResponseReceived) {
          callback(
            new RpcError(StatusCode.UNKNOWN, 'Incomplete response'),
            null,
          );
        } else {
          callback(
            null,
            responseReceived,
            null,
            null,
            /* unaryResponseReceived= */ true,
          );
        }
      }
      callback(null, null);
    });
  }

  /**
   * Encode the grpc-web request
   *
   * @param serialized The serialized proto payload
   * @return The application/grpc-web padded request
   */
  private encodeRequest(serialized: Uint8Array): Uint8Array {
    let len = serialized.length;
    const bytesArray = [0, 0, 0, 0];
    const payload = new Uint8Array(5 + len);
    for (let i = 3; i >= 0; i--) {
      bytesArray[i] = len % 256;
      len = len >>> 8;
    }
    payload.set(new Uint8Array(bytesArray), 1);
    payload.set(serialized, 5);
    return payload;
  }

  /**
   * @param xhr The xhr object
   */
  private processHeaders(xhr: XhrIo) {
    if (this.format === 'text') {
      xhr.headers.set('Content-Type', 'application/grpc-web-text');
      xhr.headers.set('Accept', 'application/grpc-web-text');
    } else {
      xhr.headers.set('Content-Type', 'application/grpc-web+proto');
    }
    xhr.headers.set('X-User-Agent', 'grpc-web-javascript/0.1');
    xhr.headers.set('X-Grpc-Web', '1');
    if (xhr.headers.has('deadline')) {
      const deadline = Number(xhr.headers.get('deadline')); // in ms
      const currentTime = new Date().getTime();
      let timeout = Math.ceil(deadline - currentTime);
      xhr.headers.delete('deadline');
      if (timeout === Infinity) {
        // grpc-timeout header defaults to infinity if not set.
        timeout = 0;
      }
      if (timeout > 0) {
        xhr.headers.set('grpc-timeout', `${timeout}m`);
        // Also set timeout on the xhr request to terminate the HTTP request
        // if the server doesn't respond within the deadline. We use 110% of
        // grpc-timeout for this to allow the server to terminate the connection
        // with DEADLINE_EXCEEDED rather than terminating it in the Browser, but
        // at least 1 second in case the user is on a high-latency network.
        xhr.setTimeoutInterval(Math.max(1000, Math.ceil(timeout * 1.1)));
      }
    }
  }

  /**
   * @param method The method to invoke
   * @param headerObject The xhr headers
   * @return The URI object or a string path with headers
   */
  private static setCorsOverride(
    method: string,
    headerObject: {[key: string]: string},
  ): string {
    return setHttpHeadersWithOverwriteParam(
      method,
      HTTP_HEADERS_PARAM_NAME,
      headerObject,
    ) as string;
  }

  private static runStreamInterceptors<REQUEST, RESPONSE>(
    invoker: (
      request: Request<REQUEST, RESPONSE>,
    ) => ClientReadableStream<RESPONSE>,
    interceptors: StreamInterceptor[],
  ): (request: Request<REQUEST, RESPONSE>) => ClientReadableStream<RESPONSE> {
    return interceptors.reduce((currInvoker, interceptor) => {
      return (request: Request<REQUEST, RESPONSE>) => {
        return interceptor.intercept(request, currInvoker);
      };
    }, invoker);
  }

  private static runUnaryInterceptors<REQUEST, RESPONSE>(
    invoker: (
      request: Request<REQUEST, RESPONSE>,
    ) => Promise<UnaryResponse<RESPONSE>>,
    interceptors: UnaryInterceptor[],
  ): (request: Request<REQUEST, RESPONSE>) => Promise<UnaryResponse<RESPONSE>> {
    return interceptors.reduce((currInvoker, interceptor) => {
      return (request: Request<REQUEST, RESPONSE>) => {
        return interceptor.intercept(request, currInvoker);
      };
    }, invoker);
  }
}
