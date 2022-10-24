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
 */
goog.module('grpc.web.GrpcWebClientBaseTest');
goog.setTestOnly('grpc.web.GrpcWebClientBaseTest');

const ClientReadableStream = goog.require('grpc.web.ClientReadableStream');
const GrpcWebClientBase = goog.require('grpc.web.GrpcWebClientBase');
const MethodDescriptor = goog.require('grpc.web.MethodDescriptor');
const ReadyState = goog.require('goog.net.XmlHttp.ReadyState');
const Request = goog.requireType('grpc.web.Request');
const RpcError = goog.require('grpc.web.RpcError');
const StatusCode = goog.require('grpc.web.StatusCode');
const XhrIo = goog.require('goog.testing.net.XhrIo');
const googCrypt = goog.require('goog.crypt.base64');
const testSuite = goog.require('goog.testing.testSuite');
const {StreamInterceptor} = goog.require('grpc.web.Interceptor');
goog.require('goog.testing.jsunit');

// This parses to [ { DATA: [4, 5, 6] }, { TRAILER: "a: b" } ]
const DEFAULT_RPC_RESPONSE =
    new Uint8Array([0, 0, 0, 0, 3, 4, 5, 6, 128, 0, 0, 0, 4, 97, 58, 32, 98]);
const DEFAULT_RPC_RESPONSE_DATA = [4, 5, 6];
const DEFAULT_UNARY_HEADERS =
    ['Content-Type', 'Accept', 'X-User-Agent', 'X-Grpc-Web'];
const DEFAULT_UNARY_HEADER_VALUES = [
  'application/grpc-web-text',
  'application/grpc-web-text',
  'grpc-web-javascript/0.1',
  '1',
];
const DEFAULT_RESPONSE_HEADERS = {
  'Content-Type': 'application/grpc-web-text',
};

testSuite({
  async testRpcResponse() {
    const xhr = new XhrIo();
    const client = new GrpcWebClientBase(/* options= */ {}, xhr);
    const methodDescriptor = createMethodDescriptor((bytes) => {
      assertElementsEquals(DEFAULT_RPC_RESPONSE_DATA, [].slice.call(bytes));
      return new MockReply('value');
    });

    const response = await new Promise((resolve, reject) => {
      client.rpcCall(
          'url', new MockRequest(), /* metadata= */ {}, methodDescriptor,
          (error, response) => {
            assertNull(error);
            resolve(response);
          });
      xhr.simulatePartialResponse(
          googCrypt.encodeByteArray(new Uint8Array(DEFAULT_RPC_RESPONSE)),
          DEFAULT_RESPONSE_HEADERS);
      xhr.simulateReadyStateChange(ReadyState.COMPLETE);
    });

    assertEquals('value', response.data);
    const headers = /** @type {!Object} */ (xhr.getLastRequestHeaders());
    assertElementsEquals(DEFAULT_UNARY_HEADERS, Object.keys(headers));
    assertElementsEquals(DEFAULT_UNARY_HEADER_VALUES, Object.values(headers));
  },

  async testRpcFalsyResponse_ForNonProtobufDescriptor() {
    const xhr = new XhrIo();
    const client = new GrpcWebClientBase(/* options= */ {}, xhr);
    const methodDescriptor = createMethodDescriptor((bytes) => {
      assertElementsEquals(DEFAULT_RPC_RESPONSE_DATA, [].slice.call(bytes));
      return 0;
    });

    const response = await new Promise((resolve, reject) => {
      client.rpcCall(
          'url', new MockRequest(), /* metadata= */ {}, methodDescriptor,
          (error, response) => {
            assertNull(error);
            resolve(response);
          });
      xhr.simulatePartialResponse(
          googCrypt.encodeByteArray(new Uint8Array(DEFAULT_RPC_RESPONSE)),
          DEFAULT_RESPONSE_HEADERS);
      xhr.simulateReadyStateChange(ReadyState.COMPLETE);
    });

    assertEquals(0, response);
    const headers = /** @type {!Object} */ (xhr.getLastRequestHeaders());
    assertElementsEquals(DEFAULT_UNARY_HEADERS, Object.keys(headers));
    assertElementsEquals(DEFAULT_UNARY_HEADER_VALUES, Object.values(headers));
  },

  async testRpcResponseThenableCall() {
    const xhr = new XhrIo();
    const client = new GrpcWebClientBase(/* options= */ {}, xhr);
    const methodDescriptor = createMethodDescriptor((bytes) => {
      assertElementsEquals(DEFAULT_RPC_RESPONSE_DATA, [].slice.call(bytes));
      return new MockReply('value');
    });

    const responsePromise = client.thenableCall(
      'url', new MockRequest(), /* metadata= */ {}, methodDescriptor);
    xhr.simulatePartialResponse(
        googCrypt.encodeByteArray(new Uint8Array(DEFAULT_RPC_RESPONSE)),
        DEFAULT_RESPONSE_HEADERS);
    xhr.simulateReadyStateChange(ReadyState.COMPLETE);
    const response = await responsePromise;

    assertEquals('value', response.data);
    const headers = /** @type {!Object} */ (xhr.getLastRequestHeaders());
    assertElementsEquals(DEFAULT_UNARY_HEADERS, Object.keys(headers));
    assertElementsEquals(DEFAULT_UNARY_HEADER_VALUES, Object.values(headers));
  },

  async testRpcFalsyResponseThenableCall_ForNonProtobufDescriptor() {
    const xhr = new XhrIo();
    const client = new GrpcWebClientBase(/* options= */ {}, xhr);
    const methodDescriptor = createMethodDescriptor((bytes) => {
      assertElementsEquals(DEFAULT_RPC_RESPONSE_DATA, [].slice.call(bytes));
      return 0;
    });

    const responsePromise = client.thenableCall(
      'url', new MockRequest(), /* metadata= */ {}, methodDescriptor);
    xhr.simulatePartialResponse(
        googCrypt.encodeByteArray(new Uint8Array(DEFAULT_RPC_RESPONSE)),
        DEFAULT_RESPONSE_HEADERS);
    xhr.simulateReadyStateChange(ReadyState.COMPLETE);
    const response = await responsePromise;

    assertEquals(0, response);
    const headers = /** @type {!Object} */ (xhr.getLastRequestHeaders());
    assertElementsEquals(DEFAULT_UNARY_HEADERS, Object.keys(headers));
    assertElementsEquals(DEFAULT_UNARY_HEADER_VALUES, Object.values(headers));
  },

  async testDeadline() {
    const xhr = new XhrIo();
    const client = new GrpcWebClientBase(/* options= */ {}, xhr);
    const methodDescriptor = createMethodDescriptor((bytes) => new MockReply());

    const deadline = new Date();
    deadline.setSeconds(deadline.getSeconds() + 1);
    await new Promise((resolve, reject) => {
      client.rpcCall(
          'url', new MockRequest(), {'deadline': deadline.getTime().toString()},
          methodDescriptor, (error, response) => {
            assertNull(error);
            resolve();
          });
      xhr.simulatePartialResponse(
          googCrypt.encodeByteArray(new Uint8Array(DEFAULT_RPC_RESPONSE)),
          DEFAULT_RESPONSE_HEADERS);
      xhr.simulateReadyStateChange(ReadyState.COMPLETE);
    });
    const headers = /** @type {!Object} */ (xhr.getLastRequestHeaders());
    const headersWithDeadline = [...DEFAULT_UNARY_HEADERS, 'grpc-timeout'];
    assertElementsEquals(headersWithDeadline, Object.keys(headers));
  },

  async testRpcError() {
    const xhr = new XhrIo();
    const client = new GrpcWebClientBase(/* options= */ {}, xhr);
    const methodDescriptor = createMethodDescriptor((bytes) => new MockReply());

    const error = await new Promise((resolve, reject) => {
      client.rpcCall(
          'urlurl', new MockRequest(), /* metadata= */ {}, methodDescriptor,
          (error, response) => {
            assertNull(response);
            resolve(error);
          });
      // This decodes to "grpc-status: 3"
      xhr.simulatePartialResponse(
          googCrypt.encodeByteArray(new Uint8Array([
            128, 0,   0,  0,   14,  103, 114, 112, 99, 45,
            115, 116, 97, 116, 117, 115, 58,  32,  51,
          ])),
          DEFAULT_RESPONSE_HEADERS);
    });
    assertTrue(error instanceof RpcError);
    assertEquals(3, error.code);
  },

  async testRpcDeserializationError() {
    const xhr = new XhrIo();
    const client = new GrpcWebClientBase(/* options= */ {}, xhr);

    const responseDeserializeFn = () => {
      throw new Error('Decoding error :)');
    };
    const methodDescriptor = createMethodDescriptor(responseDeserializeFn);
    const error = await new Promise((resolve, reject) => {
      client.rpcCall(
          'urlurl', new MockRequest(), /* metadata= */ {}, methodDescriptor,
          (error, response) => {
            assertNull(response);
            resolve(error);
          });
      xhr.simulatePartialResponse(
          googCrypt.encodeByteArray(new Uint8Array(DEFAULT_RPC_RESPONSE)),
          DEFAULT_RESPONSE_HEADERS);
    });
    assertTrue(error instanceof RpcError);
    assertEquals(StatusCode.INTERNAL, error.code);
  },

  async testRpcResponseHeader() {
    const xhr = new XhrIo();
    const client = new GrpcWebClientBase(/* options= */ {}, xhr);
    const methodDescriptor = createMethodDescriptor((bytes) => {
      assertElementsEquals(DEFAULT_RPC_RESPONSE_DATA, [].slice.call(bytes));
      return new MockReply('value');
    });

    const metadata = await new Promise((resolve, reject) => {
      const call = client.rpcCall(
          'url', new MockRequest(), /* metadata= */ {}, methodDescriptor,
          (error, response) => {
            assertNull(error);
          });
      call.on('metadata', (metadata) => {
        resolve(metadata);
      });
      xhr.simulatePartialResponse(
          googCrypt.encodeByteArray(new Uint8Array(DEFAULT_RPC_RESPONSE)), {
            'Content-Type': 'application/grpc-web-text',
            'initial-metadata-key': 'initial-metadata-value',
          });
      xhr.simulateReadyStateChange(ReadyState.COMPLETE);
    });
    assertEquals('initial-metadata-value', metadata['initial-metadata-key']);
  },

  async testStreamInterceptor() {
    const xhr = new XhrIo();
    const interceptor = new StreamResponseInterceptor();
    const methodDescriptor = createMethodDescriptor((bytes) => {
      assertElementsEquals(DEFAULT_RPC_RESPONSE_DATA, [].slice.call(bytes));
      return new MockReply('value');
    });
    const client =
        new GrpcWebClientBase({'streamInterceptors': [interceptor]}, xhr);

    const response = await new Promise((resolve, reject) => {
      client.rpcCall(
          'url', new MockRequest(), /* metadata= */ {}, methodDescriptor,
          (error, response) => {
            assertNull(error);
            resolve(response);
          });
      xhr.simulatePartialResponse(
          googCrypt.encodeByteArray(new Uint8Array(DEFAULT_RPC_RESPONSE)),
          DEFAULT_RESPONSE_HEADERS);
      xhr.simulateReadyStateChange(ReadyState.COMPLETE);
    });
    assertEquals('Intercepted value', response.data);
  },

});

/** Mocks a request proto object. */
class MockRequest {
  /**
   * @param {string=} data
   */
  constructor(data = '') {
    /** @type {string} */
    this.data = data;
  }
}

/** Mocks a response proto object. */
class MockReply {
  /**
   * @param {string=} data
   */
  constructor(data = '') {
    /** @type {string} */
    this.data = data;
  }
}

/**
 * @param {function(string): !MockReply} responseDeSerializeFn
 * @return {!MethodDescriptor<!MockRequest, !MockReply>}
 */
function createMethodDescriptor(responseDeSerializeFn) {
  return new MethodDescriptor(
      /* name= */ '', /* methodType= */ null, MockRequest, MockReply,
      (request) => [1, 2, 3], responseDeSerializeFn);
}


/**
 * @implements {StreamInterceptor}
 * @unrestricted
 */
class StreamResponseInterceptor {
  constructor() {}

  /**
   * @override
   * @template REQUEST, RESPONSE
   * @param {!Request<REQUEST, RESPONSE>} request
   * @param {function(!Request<REQUEST,RESPONSE>):
   *     !ClientReadableStream<RESPONSE>} invoker
   * @return {!ClientReadableStream<RESPONSE>}
   */
  intercept(request, invoker) {
    return new InterceptedStream(invoker(request));
  }
}

/**
 * @implements {ClientReadableStream}
 * @template RESPONSE
 * @final
 */
class InterceptedStream {
  /**
   * @param {!ClientReadableStream<RESPONSE>} stream
   */
  constructor(stream) {
    /** @const {!ClientReadableStream<RESPONSE>} */
    this.stream = stream;
  }

  /**
   * @override
   * @param {string} eventType
   * @param {function(?)} callback
   * @return {!ClientReadableStream<RESPONSE>}
   */
  on(eventType, callback) {
    if (eventType == 'data') {
      const newCallback = (response) => {
        response.data = 'Intercepted ' + response.data;
        callback(response);
      };
      this.stream.on(eventType, newCallback);
    } else {
      this.stream.on(eventType, callback);
    }
    return this;
  }

  /**
   * @override
   * @return {!ClientReadableStream<RESPONSE>}
   */
  cancel() {
    this.stream.cancel();
    return this;
  }

  /**
   * @override
   * @param {string} eventType
   * @param {function(?)} callback
   * @return {!ClientReadableStream<RESPONSE>}
   */
  removeListener(eventType, callback) {
    this.stream.removeListener(eventType, callback);
    return this;
  }
}
