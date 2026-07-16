import { ClientReadableStream } from './clientreadablestream';
import {MethodDescriptor} from './methoddescriptor';
import {RpcError} from './rpcerror';

/** Options for gRPC-Web calls returning a Promise. */
export interface PromiseCallOptions {
  /** An AbortSignal to abort the call. */
  readonly signal?: AbortSignal;
}

/** Base interface for gRPC-Web clients. */
export interface AbstractClientBase {
  /**
   * @param method The method to invoke
   * @param requestMessage The request proto
   * @param metadata User defined call metadata
   * @param methodDescriptor Information of this RPC method
   * @param callback A callback function which takes (error, RESPONSE or null)
   */
  rpcCall<REQUEST, RESPONSE>(
    method: string,
    requestMessage: REQUEST,
    metadata: {[key: string]: string},
    methodDescriptor: MethodDescriptor<REQUEST, RESPONSE>,
    callback: (p1: RpcError | null, p2: any) => void,
  ): ClientReadableStream<RESPONSE>;

  /**
   * @param method The method to invoke
   * @param requestMessage The request proto
   * @param metadata User defined call metadata
   * @param methodDescriptor Information of this RPC method
   * @param options Options for the call
   * @return A promise that resolves to the response message
   */
  thenableCall<REQUEST, RESPONSE>(
    method: string,
    requestMessage: REQUEST,
    metadata: {[key: string]: string},
    methodDescriptor: MethodDescriptor<REQUEST, RESPONSE>,
    options: PromiseCallOptions,
  ): PromiseLike<RESPONSE>;

  /**
   * @param method The method to invoke
   * @param requestMessage The request proto
   * @param metadata User defined call metadata
   * @param methodDescriptor Information of this RPC method
   * @return The Client Readable Stream
   */
  serverStreaming<REQUEST, RESPONSE>(
    method: string,
    requestMessage: REQUEST,
    metadata: {[key: string]: string},
    methodDescriptor: MethodDescriptor<REQUEST, RESPONSE>,
  ): ClientReadableStream<RESPONSE>;
}

/** Gets the hostname of the current request. */
export function getHostname<REQUEST, RESPONSE>(
  method: string,
  methodDescriptor: MethodDescriptor<REQUEST, RESPONSE>,
): string {
  // method = hostname + methodDescriptor.name(relative path of this method)
  return method.substring(0, method.length - methodDescriptor.name.length);
}
