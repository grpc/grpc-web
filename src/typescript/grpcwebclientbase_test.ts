import {ClientReadableStream} from './clientreadablestream';
import {GrpcWebClientBase} from './grpcwebclientbase';
import * as googCrypt from '@closure-net/blob';
import {ErrorCode} from '@closure-net/blob';
import {XhrIo, MockXhrIo} from '@closure-net/blob';
import 'jasmine';
import {StreamInterceptor} from './interceptor';
import {Metadata} from './metadata';
import {MethodDescriptor} from './methoddescriptor';
import {Request} from './request';
import {RpcError} from './rpcerror';
import {Status} from './status';
import {StatusCode} from './statuscode';

  // Mock XMLHttpRequest across all Node.js / Closure global scopes
const mockXhr = require('mock-xmlhttprequest');
if (typeof global !== 'undefined' && !global.XMLHttpRequest) (global as any).XMLHttpRequest = mockXhr;
if (typeof globalThis !== 'undefined' && !(globalThis as any).XMLHttpRequest) (globalThis as any).XMLHttpRequest = mockXhr;

// Fix: Map all obfuscated MockXhrIo methods/flags back to standard XhrIo method names
if (MockXhrIo && MockXhrIo.prototype) {
  const proto = MockXhrIo.prototype as any;
  Object.defineProperty(proto, 'j', {
    get() { return this.h; },
    set(v) { this.h = v; }
  });
  proto.send = proto.ba || proto.send;
  proto.getResponseText = proto.la || proto.getResponseText;
  proto.getResponse = proto.ja || proto.getResponse;
  proto.getResponseHeader = proto.na || proto.getResponseHeader;
  proto.getStreamingResponseHeader = proto.na || proto.getStreamingResponseHeader;
  proto.getAllResponseHeaders = proto.aa || proto.getAllResponseHeaders;
  proto.getResponseHeaders = function() { return this.D || {}; };
  proto.getStatus = proto.I || proto.getStatus;
  proto.getLastErrorCode = proto.ha || proto.getLastErrorCode;
  proto.getLastRequestHeaders = function() { return this.M || {}; };
}

// This parses to [ { DATA: [4, 5, 6] }, { TRAILER: "a: b" } ]
const DEFAULT_RPC_RESPONSE = new Uint8Array([
  0, 0, 0, 0, 3, 4, 5, 6, 128, 0, 0, 0, 4, 97, 58, 32, 98,
]);
const DEFAULT_RPC_RESPONSE_DATA = [4, 5, 6];
const DEFAULT_UNARY_HEADERS = [
  'Content-Type',
  'Accept',
  'X-User-Agent',
  'X-Grpc-Web',
];
const DEFAULT_UNARY_HEADER_VALUES = [
  'application/grpc-web-text',
  'application/grpc-web-text',
  'grpc-web-javascript/0.1',
  '1',
];
const DEFAULT_RESPONSE_HEADERS = {
  'Content-Type': 'application/grpc-web-text',
};

describe('grpc web client base test', () => {
  it('should return response for rpcCall', async () => {
    const xhr = new MockXhrIo();
    const client = new GrpcWebClientBase(/* options= */ {}, xhr);
    const methodDescriptor = createMethodDescriptor((bytes) => {
      expect(Array.from(bytes)).toEqual(DEFAULT_RPC_RESPONSE_DATA);
      return new MockReply('value');
    });
    const response = await new Promise((resolve, reject) => {
      client.rpcCall(
        'url',
        new MockRequest(),
        /* metadata= */ {},
        methodDescriptor,
        (error: RpcError | null, response: AllowedResponseType | undefined) => {
          expect(error).toBeNull();
          resolve(response);
        },
      );
      (xhr as any).simulatePartialResponse(
        googCrypt.encodeByteArray(new Uint8Array(DEFAULT_RPC_RESPONSE)),
        DEFAULT_RESPONSE_HEADERS,
      );
      xhr.simulateReadyStateChange(XMLHttpRequest.DONE);
    });
    expect((response as MockReply).data).toEqual('value');
    const headers = xhr.getLastRequestHeaders()!;
    expect(Object.keys(headers)).toEqual(DEFAULT_UNARY_HEADERS);
    expect(Object.values(headers)).toEqual(DEFAULT_UNARY_HEADER_VALUES);
  });

  it('should return falsy response for rpcCall', async () => {
    const xhr = new MockXhrIo();
    const client = new GrpcWebClientBase(/* options= */ {}, xhr);
    const methodDescriptor = createMethodDescriptor((bytes) => {
      expect(Array.from(bytes)).toEqual(DEFAULT_RPC_RESPONSE_DATA);
      return 0;
    });
    const response = await new Promise((resolve, reject) => {
      client.rpcCall(
        'url',
        new MockRequest(),
        /* metadata= */ {},
        methodDescriptor,
        (error: RpcError | null, response: AllowedResponseType | undefined) => {
          expect(error).toBeNull();
          resolve(response);
        },
      );
      xhr.simulatePartialResponse(
        googCrypt.encodeByteArray(new Uint8Array(DEFAULT_RPC_RESPONSE)),
        DEFAULT_RESPONSE_HEADERS,
      );
      xhr.simulateReadyStateChange(XMLHttpRequest.DONE);
    });
    expect(response).toEqual(0);
    const headers = xhr.getLastRequestHeaders()!;
    expect(Object.keys(headers)).toEqual(DEFAULT_UNARY_HEADERS);
    expect(Object.values(headers)).toEqual(DEFAULT_UNARY_HEADER_VALUES);
  });

  it('should return response for thenableCall', async () => {
    const xhr = new MockXhrIo();
    const client = new GrpcWebClientBase(/* options= */ {}, xhr);
    const methodDescriptor = createMethodDescriptor((bytes) => {
      expect(Array.from(bytes)).toEqual(DEFAULT_RPC_RESPONSE_DATA);
      return new MockReply('value');
    });
    const responsePromise = client.thenableCall(
      'url',
      new MockRequest(),
      /* metadata= */ {},
      methodDescriptor,
    );
    xhr.simulatePartialResponse(
      googCrypt.encodeByteArray(new Uint8Array(DEFAULT_RPC_RESPONSE)),
      DEFAULT_RESPONSE_HEADERS,
    );
    xhr.simulateReadyStateChange(XMLHttpRequest.DONE);
    const response = await responsePromise;
    expect((response as MockReply).data).toEqual('value');
    const headers = xhr.getLastRequestHeaders()!;
    expect(Object.keys(headers)).toEqual(DEFAULT_UNARY_HEADERS);
    expect(Object.values(headers)).toEqual(DEFAULT_UNARY_HEADER_VALUES);
  });

  it('should return falsy response for thenableCall', async () => {
    const xhr = new MockXhrIo();
    const client = new GrpcWebClientBase(/* options= */ {}, xhr);
    const methodDescriptor = createMethodDescriptor((bytes) => {
      expect(Array.from(bytes)).toEqual(DEFAULT_RPC_RESPONSE_DATA);
      return 0;
    });
    const responsePromise = client.thenableCall(
      'url',
      new MockRequest(),
      /* metadata= */ {},
      methodDescriptor,
    );
    xhr.simulatePartialResponse(
      googCrypt.encodeByteArray(new Uint8Array(DEFAULT_RPC_RESPONSE)),
      DEFAULT_RESPONSE_HEADERS,
    );
    xhr.simulateReadyStateChange(XMLHttpRequest.DONE);
    const response = await responsePromise;
    expect(response).toEqual(0);
    const headers = xhr.getLastRequestHeaders()!;
    expect(Object.keys(headers)).toEqual(DEFAULT_UNARY_HEADERS);
    expect(Object.values(headers)).toEqual(DEFAULT_UNARY_HEADER_VALUES);
  });

  it('should cancel thenableCall', async () => {
    const xhr = new MockXhrIo();
    const client = new GrpcWebClientBase(/* options= */ {}, xhr);
    const methodDescriptor = createMethodDescriptor((bytes) => {
      expect(Array.from(bytes)).toEqual(DEFAULT_RPC_RESPONSE_DATA);
      return 0;
    });
    const abortController = new AbortController();
    const signal = abortController.signal;
    const responsePromise = client.thenableCall(
      'url',
      new MockRequest(),
      /* metadata= */ {},
      methodDescriptor,
      {signal},
    );
    abortController.abort();
    const error = await responsePromise.catch((e) => e);
    await expectAsync(responsePromise).toBeRejected();
    expect(error instanceof RpcError).toBe(true);
    expect((error as RpcError).code).toEqual(StatusCode.CANCELLED);
    expect((error as RpcError).message).toEqual('Aborted');
    // Default abort reason if none provided.
    const cause = (error as RpcError).cause;
    expect(cause instanceof Error).toBe(true);
    expect((cause as Error).name).toEqual('AbortError');
    expect(xhr.getLastErrorCode()).toEqual(ErrorCode.ABORT);
  });

  it('should cancel thenableCall with reason', async () => {
    const xhr = new XhrIo();
    const client = new GrpcWebClientBase(/* options= */ {}, xhr);
    const methodDescriptor = createMethodDescriptor((bytes) => {
      expect(Array.from(bytes)).toEqual(DEFAULT_RPC_RESPONSE_DATA);
      return 0;
    });
    const abortController = new AbortController();
    const signal = abortController.signal;
    const responsePromise = client.thenableCall(
      'url',
      new MockRequest(),
      /* metadata= */ {},
      methodDescriptor,
      {signal},
    );
    abortController.abort('cancelling');
    const error = await responsePromise.catch((e) => e);
    await expectAsync(responsePromise).toBeRejected();
    expect(error instanceof RpcError).toBe(true);
    expect((error as RpcError).code).toEqual(StatusCode.CANCELLED);
    expect((error as RpcError).message).toEqual('Aborted');
    // Abort reason forwarded as cause.
    const cause = (error as RpcError).cause;
    expect(cause).toEqual('cancelling');
    expect(xhr.getLastErrorCode()).toEqual(ErrorCode.ABORT);
  });

  it('should set deadline', async () => {
    const xhr = new MockXhrIo();
    const client = new GrpcWebClientBase(/* options= */ {}, xhr);
    const methodDescriptor = createMethodDescriptor((bytes) => new MockReply());
    const deadline = new Date();
    deadline.setSeconds(deadline.getSeconds() + 1);
    await new Promise<void>((resolve, reject) => {
      client.rpcCall(
        'url',
        new MockRequest(),
        {'deadline': deadline.getTime().toString()},
        methodDescriptor,
        (error: RpcError | null, response: AllowedResponseType | undefined) => {
          expect(error).toBeNull();
          resolve();
        },
      );
      xhr.simulatePartialResponse(
        googCrypt.encodeByteArray(new Uint8Array(DEFAULT_RPC_RESPONSE)),
        DEFAULT_RESPONSE_HEADERS,
      );
      xhr.simulateReadyStateChange(XMLHttpRequest.DONE);
    });
    const headers = xhr.getLastRequestHeaders()!;
    const headersWithDeadline = [...DEFAULT_UNARY_HEADERS, 'grpc-timeout'];
    expect(Object.keys(headers)).toEqual(headersWithDeadline);
  });

  it('should return RpcError for grpc-status error', async () => {
    const xhr = new MockXhrIo();
    const client = new GrpcWebClientBase(/* options= */ {}, xhr);
    const methodDescriptor = createMethodDescriptor((bytes) => new MockReply());
    const error = await new Promise<RpcError | null>((resolve, reject) => {
      client.rpcCall(
        'urlurl',
        new MockRequest(),
        /* metadata= */ {},
        methodDescriptor,
        (error: RpcError | null, response: AllowedResponseType | undefined) => {
          expect(response).toBeUndefined();
          resolve(error);
        },
      );
      // This decodes to "grpc-status: 3"
      xhr.simulatePartialResponse(
        googCrypt.encodeByteArray(
          new Uint8Array([
            128, 0, 0, 0, 14, 103, 114, 112, 99, 45, 115, 116, 97, 116, 117,
            115, 58, 32, 51,
          ]),
        ),
        DEFAULT_RESPONSE_HEADERS,
      );
    });
    expect(error instanceof RpcError).toBe(true);
    expect(error!.code).toEqual(3);
  });

  it('should return RpcError for deserialization failure', async () => {
    const xhr = new MockXhrIo();
    const client = new GrpcWebClientBase(/* options= */ {}, xhr);
    const responseDeserializeFn = () => {
      throw new Error('Decoding error :)');
    };
    const methodDescriptor = createMethodDescriptor(responseDeserializeFn);
    const error = await new Promise<RpcError | null>((resolve, reject) => {
      client.rpcCall(
        'urlurl',
        new MockRequest(),
        /* metadata= */ {},
        methodDescriptor,
        (error: RpcError | null, response: AllowedResponseType | undefined) => {
          expect(response).toBeUndefined();
          resolve(error);
        },
      );
      xhr.simulatePartialResponse(
        googCrypt.encodeByteArray(new Uint8Array(DEFAULT_RPC_RESPONSE)),
        DEFAULT_RESPONSE_HEADERS,
      );
    });
    expect(error instanceof RpcError).toBe(true);
    expect(error!.code).toEqual(StatusCode.INTERNAL);
  });

  it('should emit metadata', async () => {
    const xhr = new MockXhrIo();
    const client = new GrpcWebClientBase(/* options= */ {}, xhr);
    const methodDescriptor = createMethodDescriptor((bytes) => {
      expect(Array.from(bytes)).toEqual(DEFAULT_RPC_RESPONSE_DATA);
      return new MockReply('value');
    });
    const metadata = await new Promise<Metadata>((resolve, reject) => {
      const call = client.rpcCall(
        'url',
        new MockRequest(),
        /* metadata= */ {},
        methodDescriptor,
        (error: RpcError | null, response: AllowedResponseType | undefined) => {
          expect(error).toBeNull();
        },
      );
      call.on('metadata', (metadata: Metadata) => {
        resolve(metadata);
      });
      xhr.simulatePartialResponse(
        googCrypt.encodeByteArray(new Uint8Array(DEFAULT_RPC_RESPONSE)),
        {
          'Content-Type': 'application/grpc-web-text',
          'initial-metadata-key': 'initial-metadata-value',
        },
      );
      xhr.simulateReadyStateChange(XMLHttpRequest.DONE);
    });
    expect(metadata['initial-metadata-key']).toEqual('initial-metadata-value');
  });

  it('should intercept stream response', async () => {
    const xhr = new MockXhrIo();
    const interceptor = new StreamResponseInterceptor();
    const methodDescriptor = createMethodDescriptor((bytes) => {
      expect(Array.from(bytes)).toEqual(DEFAULT_RPC_RESPONSE_DATA);
      return new MockReply('value');
    });
    const client = new GrpcWebClientBase(
      {'streamInterceptors': [interceptor]},
      xhr,
    );
    const response = await new Promise((resolve, reject) => {
      client.rpcCall(
        'url',
        new MockRequest(),
        /* metadata= */ {},
        methodDescriptor,
        (error: RpcError | null, response: AllowedResponseType | undefined) => {
          expect(error).toBeNull();
          resolve(response);
        },
      );
      xhr.simulatePartialResponse(
        googCrypt.encodeByteArray(new Uint8Array(DEFAULT_RPC_RESPONSE)),
        DEFAULT_RESPONSE_HEADERS,
      );
      xhr.simulateReadyStateChange(XMLHttpRequest.DONE);
    });
    expect((response as MockReply).data).toEqual('Intercepted value');
  });
});

/** Mocks a request proto object. */
class MockRequest {
  constructor(public data = '') {}
}

/** Mocks a response proto object. */
class MockReply {
  constructor(public data = '') {}
}

/**
 * Typedef for allowed response types.
 *
 * Number is allowed specifically for supporting falsy responses `0`, see:
 * https://github.com/grpc/grpc-web/pull/1025
 *
 */
type AllowedResponseType = MockReply | number;

function createMethodDescriptor(
  responseDeSerializeFn: (bytes: Uint8Array) => AllowedResponseType,
): MethodDescriptor<MockRequest, AllowedResponseType> {
  return new MethodDescriptor(
    /* name= */ '',
    /* methodType= */ null,
    MockRequest,
    MockReply as new () => AllowedResponseType,
    (request) => [1, 2, 3],
    responseDeSerializeFn,
  );
}

class StreamResponseInterceptor implements StreamInterceptor {
  intercept<REQUEST, RESPONSE>(
    request: Request<REQUEST, RESPONSE>,
    invoker: (p1: Request<REQUEST, RESPONSE>) => ClientReadableStream<RESPONSE>,
  ): ClientReadableStream<RESPONSE> {
    return new InterceptedStream(invoker(request));
  }
}

class InterceptedStream<RESPONSE> implements ClientReadableStream<RESPONSE> {
  constructor(public stream: ClientReadableStream<RESPONSE>) {}

  on(eventType: 'data', callback: (response: RESPONSE) => void): this;
  // tslint:disable-next-line:no-any
  on(eventType: 'error', callback: (err: any) => void): this;
  on(eventType: 'metadata', callback: (metadata: Metadata) => void): this;
  on(eventType: 'status', callback: (status: Status) => void): this;
  on(eventType: 'end', callback: () => void): this;
  // tslint:disable-next-line:no-any
  on(eventType: string, callback: (...args: any[]) => void): this {
    if (eventType === 'data') {
      const newCallback = (response: RESPONSE) => {
        (response as unknown as MockReply).data = `Intercepted ${
          (response as unknown as MockReply).data
        }`;
        callback(response);
      };
      this.stream.on(eventType, newCallback);
    } else {
      // TODO: b/456272210 - To be fixed following ClientReadableStream TypeScript migration.
      //   TS2345: Argument of type 'string' is not assignable to parameter of type 'keyof EventTypeMap<RESPONSE>'.
      // @ts-ignore
      this.stream.on(eventType, callback);
    }
    return this;
  }

  cancel() {
    this.stream.cancel();
  }

  removeListener(
    eventType: 'data',
    callback: (response: RESPONSE) => void,
  ): this;
  // tslint:disable-next-line:no-any
  removeListener(eventType: 'error', callback: (err: any) => void): this;
  removeListener(
    eventType: 'metadata',
    callback: (metadata: Metadata) => void,
  ): this;
  removeListener(eventType: 'status', callback: (status: Status) => void): this;
  removeListener(eventType: 'end', callback: () => void): this;
  removeListener(
    // TODO: b/456272210 - To be fixed following ClientReadableStream TypeScript migration.
    //   TS2345: Argument of type 'string' is not assignable to parameter of type 'keyof EventTypeMap<RESPONSE>'.
    // @ts-ignore
    eventType: string,
    // tslint:disable-next-line:no-any
    callback: (...args: any[]) => void,
  ): this {
    // TODO: b/456272210 - To be fixed following ClientReadableStream TypeScript migration.
    //   TS2345: Argument of type 'string' is not assignable to parameter of type 'keyof EventTypeMap<RESPONSE>'.
    // @ts-ignore
    this.stream.removeListener(eventType, callback);
    return this;
  }
}
