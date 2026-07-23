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
import {GrpcWebStreamParser} from './grpcwebstreamparser';
import 'jasmine';

let parser: GrpcWebStreamParser;

describe('grpc web stream parser test', () => {
  beforeEach(() => {
    parser = new GrpcWebStreamParser();
  });

  it('should throw error for invalid tag', () => {
    const arr = new Uint8Array([1, 0]);
    expect(() => parser.parse(arr.buffer)).toThrow();
  });

  it('should throw error for invalid input type string', () => {
    expect(() => parser.parse('abc')).toThrow();
  });

  it('should parse basic message', () => {
    const arr = new Uint8Array([0, 0, 0, 0, 2, 38, 39]);
    const messages = parser.parse(arr.buffer)!;
    expect(messages.length).toEqual(1);
    const message = messages[0];
    assertFrame(message, GrpcWebStreamParser.FrameType.DATA);
    expect(message[GrpcWebStreamParser.FrameType.DATA]).toEqual(
      new Uint8Array([38, 39]),
    );
  });

  it('should parse one message one trailer', () => {
    const arr = new Uint8Array([
      0, 0, 0, 0, 2, 38, 39, 128, 0, 0, 0, 2, 40, 41,
    ]);
    const messages = parser.parse(arr.buffer)!;
    expect(messages.length).toEqual(2);
    const message = messages[0];
    assertFrame(message, GrpcWebStreamParser.FrameType.DATA);
    expect(message[GrpcWebStreamParser.FrameType.DATA]).toEqual(
      new Uint8Array([38, 39]),
    );
    const trailer = messages[1];
    assertFrame(trailer, GrpcWebStreamParser.FrameType.TRAILER);
    expect(trailer[GrpcWebStreamParser.FrameType.TRAILER]).toEqual(
      new Uint8Array([40, 41]),
    );
  });

  it('should parse multiple message one trailer', () => {
    const arr = new Uint8Array([
      0, 0, 0, 0, 2, 38, 39, 0, 0, 0, 0, 3, 42, 43, 44, 128, 0, 0, 0, 2, 40, 41,
    ]);
    const messages = parser.parse(arr.buffer)!;
    expect(messages.length).toEqual(3);
    const message1 = messages[0];
    assertFrame(message1, GrpcWebStreamParser.FrameType.DATA);
    expect(message1[GrpcWebStreamParser.FrameType.DATA]).toEqual(
      new Uint8Array([38, 39]),
    );
    const message2 = messages[1];
    assertFrame(message2, GrpcWebStreamParser.FrameType.DATA);
    expect(message2[GrpcWebStreamParser.FrameType.DATA]).toEqual(
      new Uint8Array([42, 43, 44]),
    );
    const trailer = messages[2];
    assertFrame(trailer, GrpcWebStreamParser.FrameType.TRAILER);
    expect(trailer[GrpcWebStreamParser.FrameType.TRAILER]).toEqual(
      new Uint8Array([40, 41]),
    );
  });

  it('should parse partial message', () => {
    let arr = new Uint8Array([0, 0, 0, 0, 2, 38]);
    let messages = parser.parse(arr.buffer);
    expect(messages).toBeNull();
    arr = new Uint8Array([39]);
    messages = parser.parse(arr.buffer)!;
    expect(messages.length).toEqual(1);
    const message = messages[0];
    assertFrame(message, GrpcWebStreamParser.FrameType.DATA);
    expect(message[GrpcWebStreamParser.FrameType.DATA]).toEqual(
      new Uint8Array([38, 39]),
    );
  });

  it('should parse multiple partial messages', () => {
    let arr = new Uint8Array([0, 0, 0, 0, 2, 38]);
    let messages = parser.parse(arr.buffer);
    expect(messages).toBeNull();
    arr = new Uint8Array([39, 128, 0, 0]);
    messages = parser.parse(arr.buffer)!;
    expect(messages.length).toEqual(1);
    const message = messages[0];
    assertFrame(message, GrpcWebStreamParser.FrameType.DATA);
    expect(message[GrpcWebStreamParser.FrameType.DATA]).toEqual(
      new Uint8Array([38, 39]),
    );
    arr = new Uint8Array([0, 3, 40]);
    messages = parser.parse(arr.buffer);
    expect(messages).toBeNull();
    arr = new Uint8Array([41, 42]);
    messages = parser.parse(arr.buffer)!;
    expect(messages.length).toEqual(1);
    const trailer = messages[0];
    assertFrame(trailer, GrpcWebStreamParser.FrameType.TRAILER);
    expect(trailer[GrpcWebStreamParser.FrameType.TRAILER]).toEqual(
      new Uint8Array([40, 41, 42]),
    );
  });

  it('should parse trailer only', () => {
    const arr = new Uint8Array([128, 0, 0, 0, 2, 40, 41]);
    const messages = parser.parse(arr.buffer)!;
    expect(messages.length).toEqual(1);
    const trailer = messages[0];
    assertFrame(trailer, GrpcWebStreamParser.FrameType.TRAILER);
    expect(trailer[GrpcWebStreamParser.FrameType.TRAILER]).toEqual(
      new Uint8Array([40, 41]),
    );
  });

  it('should parse empty message', () => {
    const arr = new Uint8Array([0, 0, 0, 0, 0]);
    const messages = parser.parse(arr.buffer)!;
    expect(messages.length).toEqual(1);
    const message = messages[0];
    assertFrame(message, GrpcWebStreamParser.FrameType.DATA);
    expect(message[GrpcWebStreamParser.FrameType.DATA]).toEqual(
      new Uint8Array([]),
    );
  });

  it('should parse empty message with trailer', () => {
    const arr = new Uint8Array([0, 0, 0, 0, 0, 128, 0, 0, 0, 1, 56]);
    const messages = parser.parse(arr.buffer)!;
    expect(messages.length).toEqual(2);
    const message = messages[0];
    assertFrame(message, GrpcWebStreamParser.FrameType.DATA);
    expect(message[GrpcWebStreamParser.FrameType.DATA]).toEqual(
      new Uint8Array([]),
    );
    const trailer = messages[1];
    assertFrame(trailer, GrpcWebStreamParser.FrameType.TRAILER);
    expect(trailer[GrpcWebStreamParser.FrameType.TRAILER]).toEqual(
      new Uint8Array([56]),
    );
  });

  it('should throw error after first message', () => {
    let arr = new Uint8Array([0, 0, 0, 0, 2, 38, 39]);
    const messages = parser.parse(arr.buffer)!;
    expect(messages.length).toEqual(1);
    const message = messages[0];
    assertFrame(message, GrpcWebStreamParser.FrameType.DATA);
    expect(message[GrpcWebStreamParser.FrameType.DATA]).toEqual(
      new Uint8Array([38, 39]),
    );
    arr = new Uint8Array([1, 0]);
    expect(() => parser.parse(arr.buffer)).toThrow();
  });

  it('should throw error for invalid message', () => {
    const arr = new Uint8Array([
      0, 0, 0, 0, 2, 38, 39, 40, 0, 0, 0, 0, 2, 41, 42,
    ]);
    expect(() => parser.parse(arr.buffer)).toThrow();
  });

  it('should parse empty array', () => {
    const arr = new Uint8Array([]);
    const messages = parser.parse(arr.buffer);
    expect(messages).toBeNull();
  });

  it('should parse message after empty array', () => {
    let arr = new Uint8Array([]);
    let messages = parser.parse(arr.buffer);
    expect(messages).toBeNull();
    arr = new Uint8Array([]);
    messages = parser.parse(arr.buffer);
    expect(messages).toBeNull();
    arr = new Uint8Array([0]);
    messages = parser.parse(arr.buffer);
    expect(messages).toBeNull();
    arr = new Uint8Array([]);
    messages = parser.parse(arr.buffer);
    expect(messages).toBeNull();
    arr = new Uint8Array([0, 0, 0]);
    messages = parser.parse(arr.buffer);
    expect(messages).toBeNull();
    arr = new Uint8Array([]);
    messages = parser.parse(arr.buffer);
    expect(messages).toBeNull();
    arr = new Uint8Array([2, 38, 39]);
    messages = parser.parse(arr.buffer)!;
    expect(messages.length).toEqual(1);
    const message = messages[0];
    assertFrame(message, GrpcWebStreamParser.FrameType.DATA);
    expect(message[GrpcWebStreamParser.FrameType.DATA]).toEqual(
      new Uint8Array([38, 39]),
    );
  });

  function assertFrame(
    candidate: unknown,
    frameType: number,
  ): asserts candidate is Record<number, Uint8Array> {
    expect(typeof candidate === 'object' && candidate !== null).toBe(true);
    expect(frameType in (candidate as object)).toBe(true);
  }
});
