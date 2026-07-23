/**
 * @fileoverview grpc-web client interceptors.
 *
 * The type of interceptors is determined by the response type of the RPC call.
 * gRPC-Web has two generated clients for one service:
 * FooServiceClient and FooServicePromiseClient. The response type of
 * FooServiceClient is ClientReadableStream for BOTH unary calls and server
 * streaming calls, so StreamInterceptor is expected to be used for intercepting
 * FooServiceClient calls. The response type of PromiseClient is Promise, so use
 * UnaryInterceptor for PromiseClients.
 */

import {ClientReadableStream} from './clientreadablestream';
import {Request} from './request';
import {UnaryResponse} from './unaryresponse';

/**
 * Interceptor for RPC calls with response type `UnaryResponse`.
 *
 * An example implementation of UnaryInterceptor:
 * <pre>
 * TestUnaryInterceptor.prototype.intercept = function(request, invoker) {
 *   const newRequest = ...
 *   return invoker(newRequest).then((response) => {
 *     // Do something with response.getMetadata
 *     // Do something with response.getResponseMessage
 *     return response;
 *   });
 * };
 * </pre>
 */
export interface UnaryInterceptor {
  intercept<REQUEST, RESPONSE>(
    request: Request<REQUEST, RESPONSE>,
    invoker: (
      request: Request<REQUEST, RESPONSE>,
    ) => Promise<UnaryResponse<RESPONSE>>,
  ): Promise<UnaryResponse<RESPONSE>>;
}

/**
 * Interceptor for RPC calls with response type `ClientReadableStream`.
 *
 * Two steps to create a stream interceptor:
 * <1>Create a new subclass of ClientReadableStream that wraps around the
 * original stream and overrides its methods. <2>Create a new subclass of
 * StreamInterceptor. While implementing the
 * StreamInterceptor.prototype.intercept method, return the wrapped
 * ClientReadableStream.
 */
export interface StreamInterceptor {
  intercept<REQUEST, RESPONSE>(
    request: Request<REQUEST, RESPONSE>,
    invoker: (
      request: Request<REQUEST, RESPONSE>,
    ) => ClientReadableStream<RESPONSE>,
  ): ClientReadableStream<RESPONSE>;
}

