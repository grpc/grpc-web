declare module "grpc-web" {

  export interface Metadata { [s: string]: string; }

  export namespace AbstractClientBase {
    class MethodInfo<REQ, RESP> {
      constructor (responseType: new () => RESP,
                   requestSerializeFn: (request: REQ) => {},
                   responseDeserializeFn: (bytes: Uint8Array) => RESP);
    }
  }

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
      callback: (err: Error, response: RESP) => void
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
        callback: (err: Error) => void): ClientReadableStream<RESP>;
    on (eventType: "status",
        callback: (status: Status) => void): ClientReadableStream<RESP>;
    on (eventType: "metadata",
        callback: (status: Metadata) => void): ClientReadableStream<RESP>;
    on (eventType: "data",
        callback: (response: RESP) => void): ClientReadableStream<RESP>;
    on (eventType: "end",
        callback: () => void): ClientReadableStream<RESP>;

    removeListener (eventType: "error",
                    callback: (err: Error) => void): void;
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
                methodType: any,
                requestType: any,
                responseType: any,
                requestSerializeFn: any,
                responseDeserializeFn: any);
    createRequest(requestMessage: REQ,
                  metadata: Metadata,
                  callOptions: CallOptions): UnaryResponse<REQ, RESP>;
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
  }

  export class GrpcWebClientBase extends AbstractClientBase {
    constructor (options: GrpcWebClientBaseOptions);
  }

  export interface Error {
    code: number;
    message: string;
  }

  export interface Status {
    code: number;
    details: string;
    metadata?: Metadata;
  }

  export namespace StatusCode {
    const ABORTED: number;
    const ALREADY_EXISTS: number;
    const CANCELLED: number;
    const DATA_LOSS: number;
    const DEADLINE_EXCEEDED: number;
    const FAILED_PRECONDITION: number;
    const INTERNAL: number;
    const INVALID_ARGUMENT: number;
    const NOT_FOUND: number;
    const OK: number;
    const OUT_OF_RANGE: number;
    const PERMISSION_DENIED: number;
    const RESOURCE_EXHAUSTED: number;
    const UNAUTHENTICATED: number;
    const UNAVAILABLE: number;
    const UNIMPLEMENTED: number;
    const UNKNOWN: number;
  }
}
