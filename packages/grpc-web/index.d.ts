declare module "grpc-web" {

  export interface Metadata { [s: string]: string; }

  export class AbstractClientBase {
    thenableCall<REQ, RESP> (
      method: string,
      request: REQ,
      metadata: Metadata,
      methodDescriptor: MethodDescriptor<REQ, RESP>
    ): Promise<RESP>;

    rpcCall<REQ, RESP> (
      method: string,
      request: REQ,
      metadata: Metadata,
      methodDescriptor: MethodDescriptor<REQ, RESP>,
      callback: (err: RpcError, response: RESP) => void
    ): ClientReadableStream<RESP>;

    serverStreaming<REQ, RESP> (
      method: string,
      request: REQ,
      metadata: Metadata,
      methodDescriptor: MethodDescriptor<REQ, RESP>
    ): ClientReadableStream<RESP>;
  }

  export class ClientReadableStream<RESP> {
    on (eventType: "error",
        callback: (err: RpcError) => void): ClientReadableStream<RESP>;
    on (eventType: "status",
        callback: (status: Status) => void): ClientReadableStream<RESP>;
    on (eventType: "metadata",
        callback: (status: Metadata) => void): ClientReadableStream<RESP>;
    on (eventType: "data",
        callback: (response: RESP) => void): ClientReadableStream<RESP>;
    on (eventType: "end",
        callback: () => void): ClientReadableStream<RESP>;

    removeListener (eventType: "error",
                    callback: (err: RpcError) => void): void;
    removeListener (eventType: "status",
                    callback: (status: Status) => void): void;
    removeListener (eventType: "metadata",
                    callback: (status: Metadata) => void): void;
    removeListener (eventType: "data",
                    callback: (response: RESP) => void): void;
    removeListener (eventType: "end",
                    callback: () => void): void;

    cancel (): void;
  }

  export interface StreamInterceptor<REQ, RESP> {
    intercept(request: Request<REQ, RESP>,
              invoker: (request: Request<REQ, RESP>) =>
      ClientReadableStream<RESP>): ClientReadableStream<RESP>;
  }

  export interface UnaryInterceptor<REQ, RESP> {
    intercept(request: Request<REQ, RESP>,
              invoker: (request: Request<REQ, RESP>) =>
      Promise<UnaryResponse<REQ, RESP>>): Promise<UnaryResponse<REQ, RESP>>;
  }

  export class CallOptions {
    constructor(options: { [index: string]: any; });
  }

  export class MethodDescriptor<REQ, RESP> {
    constructor(name: string,
                methodType: string,
                requestType: new (...args: unknown[]) => REQ,
                responseType: new (...args: unknown[]) => RESP,
                requestSerializeFn: any,
                responseDeserializeFn: any);
    createRequest(requestMessage: REQ,
                  metadata?: Metadata,
                  callOptions?: CallOptions): Request<REQ, RESP>;
    createUnaryResponse(responseMessage: RESP,
                        metadata?: Metadata,
                        status?: Status): UnaryResponse<REQ, RESP>;
    getName(): string;
    getMethodType(): string;
    getRequestMessageCtor(): new (...args: unknown[]) => REQ;
    getResponseMessageCtor(): new (...args: unknown[]) => RESP;
    getRequestSerializeFn(): any;
    getResponseDeserializeFn(): any;
  }

  export class Request<REQ, RESP> {
    getRequestMessage(): REQ;
    getMethodDescriptor(): MethodDescriptor<REQ, RESP>;
    getMetadata(): Metadata;
    getCallOptions(): CallOptions;
  }

  export class UnaryResponse<REQ, RESP> {
    getResponseMessage(): RESP;
    getMetadata(): Metadata;
    getMethodDescriptor(): MethodDescriptor<REQ, RESP>;
    getStatus(): Status;
  }

  export interface GrpcWebClientBaseOptions {
    format?: string;
    suppressCorsPreflight?: boolean;
    withCredentials?: boolean;
    unaryInterceptors?: UnaryInterceptor<unknown, unknown>[];
    streamInterceptors?: StreamInterceptor<unknown, unknown>[];
  }

  export class GrpcWebClientBase extends AbstractClientBase {
    constructor(options?: GrpcWebClientBaseOptions);
  }

  export class RpcError extends Error {
    constructor(code: StatusCode, message: string, metadata: Metadata);
    code: StatusCode;
    metadata: Metadata;
  }

  export interface Status {
    code: number;
    details: string;
    metadata?: Metadata;
  }

  export enum StatusCode {
    ABORTED,
    ALREADY_EXISTS,
    CANCELLED,
    DATA_LOSS,
    DEADLINE_EXCEEDED,
    FAILED_PRECONDITION,
    INTERNAL,
    INVALID_ARGUMENT,
    NOT_FOUND,
    OK,
    OUT_OF_RANGE,
    PERMISSION_DENIED,
    RESOURCE_EXHAUSTED,
    UNAUTHENTICATED,
    UNAVAILABLE,
    UNIMPLEMENTED,
    UNKNOWN,
  }

  export namespace MethodType {
    const UNARY: string;
    const SERVER_STREAMING: string;
  }
}
