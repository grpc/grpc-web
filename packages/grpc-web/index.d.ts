declare module "grpc-web" {

  export interface Metadata { [s: string]: string; }

  export namespace AbstractClientBase {
    class MethodInfo {
      constructor (responseType: {},
                   requestSerializeFn: (request: {}) => {},
                   responseDeserializeFn: (bytes: {}) => {});
    }
  }

  export class AbstractClientBase {
    rpcCall (method: string,
             request: {},
             metadata: Metadata,
             methodInfo: AbstractClientBase.MethodInfo,
             callback: (err: Error, response: {}) => void
            ): ClientReadableStream;

    serverStreaming (method: string,
                     request: {},
                     metadata: Metadata,
                     methodInfo: AbstractClientBase.MethodInfo
                    ): ClientReadableStream;
  }

  export class ClientReadableStream {
    on (type: string,
        callback: (...args: Array<{}>) => void): ClientReadableStream;
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
