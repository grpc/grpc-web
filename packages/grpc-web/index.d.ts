declare module "grpc-web" {

  export interface Metadata { [s: string]: string; }

  export namespace AbstractClientBase {
    class MethodInfo<Request, Response> {
      constructor (responseType: new () => Response,
                   requestSerializeFn: (request: Request) => {},
                   responseDeserializeFn: (bytes: {}) => Response);
    }
  }

  export class AbstractClientBase {
    rpcCall<Request, Response> (method: string,
             request: Request,
             metadata: Metadata,
             methodInfo: AbstractClientBase.MethodInfo<Request, Response>,
             callback: (err: Error, response: Response) => void
            ): ClientReadableStream<Response>;

    serverStreaming (method: string,
                     request: Request,
                     metadata: Metadata,
                     methodInfo: AbstractClientBase.MethodInfo<Request, Response>
                    ): ClientReadableStream<Response>;
  }

  export class ClientReadableStream<Response> {
    on (type: "error",
        callback: (err: Error) => void): ClientReadableStream<Response>;
    on (type: "status",
        callback: (status: Status) => void): ClientReadableStream<Response>;
    on (type: "data",
        callback: (response: Response) => void): ClientReadableStream<Response>;
    on (type: "end",
        callback: () => void): ClientReadableStream<Response>;
    cancel (): void;
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
