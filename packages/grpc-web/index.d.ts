declare module "grpc-web" {

  export interface Metadata { [s: string]: string; }

  export namespace AbstractClientBase {
    class MethodInfo<Request, Response> {
      constructor (responseType: new () => Response,
                   requestSerializeFn: (request: Request) => {},
                   responseDeserializeFn: (bytes: Uint8Array) => Response);
    }
  }

  export class AbstractClientBase {
    unaryCall<Request, Response> (method: string,
             request: Request,
             metadata: Metadata,
             methodInfo: AbstractClientBase.MethodInfo<Request, Response>
            ): Promise<Response>;

    rpcCall<Request, Response> (method: string,
             request: Request,
             metadata: Metadata,
             methodInfo: AbstractClientBase.MethodInfo<Request, Response>,
             callback: (err: Error, response: Response) => void
            ): ClientReadableStream<Response>;

    serverStreaming<Request, Response> (method: string,
                     request: Request,
                     metadata: Metadata,
                     methodInfo: AbstractClientBase.MethodInfo<Request, Response>
                    ): ClientReadableStream<Response>;
  }

  export class ClientReadableStream<Response> {
    on (eventType: "error",
        callback: (err: Error) => void): ClientReadableStream<Response>;
    on (eventType: "status",
        callback: (status: Status) => void): ClientReadableStream<Response>;
    on (eventType: "metadata",
        callback: (status: Metadata) => void): ClientReadableStream<Response>;
    on (eventType: "data",
        callback: (response: Response) => void): ClientReadableStream<Response>;
    on (eventType: "end",
        callback: () => void): ClientReadableStream<Response>;
    on (eventType: string,
        callback: any): ClientReadableStream<Response>;

    removeListener (eventType: "error",
                    callback: (err: Error) => void): void;
    removeListener (eventType: "status",
                    callback: (status: Status) => void): void;
    removeListener (eventType: "metadata",
                    callback: (status: Metadata) => void): void;
    removeListener (eventType: "data",
                    callback: (response: Response) => void): void;
    removeListener (eventType: "end",
                    callback: () => void): void;
    removeListener (eventType: string,
                    callback: any): void;
                    
    cancel (): void;
  }

  export interface StreamInterceptor<Req, Resp> {
    intercept(request: Request<Req, Resp>,
              invoker: (request: Request<Req, Resp>) =>
      ClientReadableStream<Resp>): ClientReadableStream<Resp>;
  }

  export interface UnaryInterceptor<Req, Resp> {
    intercept(request: Request<Req, Resp>,
              invoker: (request: Request<Req, Resp>) =>
      Promise<UnaryResponse<Req, Resp>>): Promise<UnaryResponse<Req, Resp>>;
  }

  export class CallOptions {
    constructor(options: { [index: string]: any; });
  }

  export class MethodDescriptor<Req, Resp> {
    constructor(name: string,
                methodType: any,
                requestType: any,
                responseType: any,
                requestSerializeFn: any,
                responseDeserializeFn: any);
    createRequest(requestMessage: Req,
                  metadata: Metadata,
                  callOptions: CallOptions): UnaryResponse<Req, Resp>;
  }
  
  export class Request<Req, Resp> {
    getRequestMessage(): Req;
    getMethodDescriptor(): MethodDescriptor<Req, Resp>;
    getMetadata(): Metadata;
    getCallOptions(): CallOptions;
  }
  
  export class UnaryResponse<Req, Resp> {
    getResponseMessage(): Resp;
    getMetadata(): Metadata;
    getMethodDescriptor(): MethodDescriptor<Req, Resp>;
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
