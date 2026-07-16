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
 * @fileoverview The default grpc-web stream parser
 *
 * The default grpc-web parser decodes the input stream (binary) under the
 * following rules:
 *
 * 1. The wire format looks like:
 *
 *    0x00 <data> 0x80 <trailer>
 *
 *    For details of grpc-web wire format see
 *    https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-WEB.md
 *
 * 2. Messages will be delivered once each frame is completed. Partial stream
 *    segments are accepted.
 *
 * 3. Example:
 *
 * Incoming data: 0x00 <message1> 0x00 <message2> 0x80 <trailers>
 *
 * Result: [ { 0x00 : <message1 }, { 0x00 : <message2> }, { 0x80 : trailers } ]
 */

import { assert, StreamParser } from '@closure-net/blob';
  
/**
 * The default grpc-web stream parser.
 * @final
 */
export class GrpcWebStreamParser implements StreamParser {
  /**
   * The current error message, if any.
   */
  private errorMessage: string | null = null;

  /**
   * The currently buffered result (parsed messages).
   */
  private result: Array<{[key: number]: Uint8Array | number[] | null}> = [];

  /**
   * The current position in the streamed data.
   */
  private streamPos = 0;

  /**
   * The current parser state.
   */
  private state: GrpcWebStreamParserState;

  /**
   * The current frame byte being parsed
   */
  private frame = 0;

  /**
   * The length of the proto message being parsed.
   */
  private length = 0;

  /**
   * Count of processed length bytes.
   */
  private countLengthBytes = 0;

  /**
   * Raw bytes of the current message. Uses Uint8Array by default. Falls back
   * to native array when Uint8Array is unsupported.
   */
  private messageBuffer: Uint8Array | number[] | null = null;

  /**
   * Count of processed message bytes.
   */
  private countMessageBytes = 0;

  constructor() {
    this.state = GrpcWebStreamParserState.INIT;
  }

  isInputValid() {
    return this.state !== GrpcWebStreamParserState.INVALID;
  }

  getErrorMessage() {
    return this.errorMessage;
  }

  acceptsBinaryInput(): boolean {
    return true;
  }

  /**
   * Parse the new input.
   *
   * Note that there is no Parser state to indicate the end of a stream.
   *
   * @param input The input data
   * @throws {!Error} Throws an error message if the input is invalid.
   * @return any parsed objects (atomic messages)
   *    in an array, or null if more data needs be read to parse any new object.
   */
  parse(
    input: string | ArrayBuffer | Uint8Array | number[],
  ): Array<string | {[key: number]: Uint8Array | number[] | null}> | null {
    assert(
      typeof input === 'string' ||
        input instanceof Array ||
        input instanceof ArrayBuffer ||
        input instanceof Uint8Array,
    );

    let inputBytes: Uint8Array | number[];
    let pos = 0;

    if (typeof input === 'string') {
      // Although `acceptsBinaryInput` returns true, allowing string input
      // provides better type safety and flexibility. The string is encoded
      // as UTF-8 bytes.
      const encoder = new TextEncoder();
      inputBytes = encoder.encode(input);
    } else if (input instanceof Uint8Array || input instanceof Array) {
      inputBytes = input;
    } else {
      inputBytes = new Uint8Array(input);
    }

    while (pos < inputBytes.length) {
      switch (this.state) {
        case GrpcWebStreamParserState.INVALID: {
          this.error(inputBytes, pos, 'stream already broken');
          break;
        }
        case GrpcWebStreamParserState.INIT: {
          this.processFrameByte(inputBytes, pos, inputBytes[pos]);
          break;
        }
        case GrpcWebStreamParserState.LENGTH: {
          this.processLengthByte(inputBytes[pos]);
          break;
        }
        case GrpcWebStreamParserState.MESSAGE: {
          this.processMessageByte(inputBytes[pos]);
          break;
        }
        default: {
          throw new Error(`unexpected parser state: ${this.state}`);
        }
      }

      this.streamPos++;
      pos++;
    }

    const msgs = this.result;
    this.result = [];
    return msgs.length > 0 ? msgs : null;
  }

  /**
   * @param inputBytes The current input buffer
   * @param pos The position in the current input
   * @param b A frame byte to process
   */
  private processFrameByte(
    inputBytes: Uint8Array | number[],
    pos: number,
    b: number,
  ) {
    if (b === GrpcWebStreamParser.FrameType.DATA) {
      this.frame = b;
    } else if (b === GrpcWebStreamParser.FrameType.TRAILER) {
      this.frame = b;
    } else {
      this.error(inputBytes, pos, 'invalid frame byte');
    }

    this.state = GrpcWebStreamParserState.LENGTH;
    this.length = 0;
    this.countLengthBytes = 0;
  }

  /**
   * @param b A length byte to process
   */
  private processLengthByte(b: number) {
    this.countLengthBytes++;
    this.length = (this.length << 8) + b;

    if (this.countLengthBytes === 4) {
      // no more length byte
      this.state = GrpcWebStreamParserState.MESSAGE;
      this.countMessageBytes = 0;
      if (typeof Uint8Array !== 'undefined') {
        this.messageBuffer = new Uint8Array(this.length);
      } else {
        this.messageBuffer = new Array(this.length);
      }

      if (this.length === 0) {
        // empty message
        this.finishMessage();
      }
    }
  }

  /**
   * @param b A message byte to process
   */
  private processMessageByte(b: number) {
    this.messageBuffer![this.countMessageBytes++] = b;
    if (this.countMessageBytes === this.length) {
      this.finishMessage();
    }
  }

  /**
   * Finishes up building the current message and resets parser state
   */
  private finishMessage() {
    const message: {[key: number]: Uint8Array | number[] | null} = {};
    message[this.frame] = this.messageBuffer;
    this.result.push(message);
    this.state = GrpcWebStreamParserState.INIT;
  }

  /**
   * @param inputBytes The current input buffer
   * @param pos The position in the current input that triggers the error
   * @param errorMsg Additional error message
   * @throws {!Error} Throws an error indicating where the stream is broken
   */
  private error(
    inputBytes: Uint8Array | number[],
    pos: number,
    errorMsg: string,
  ) {
    this.state = GrpcWebStreamParserState.INVALID;
    this.errorMessage = `The stream is broken @${this.streamPos}/${pos}. Error: ${errorMsg}. With input:\n${inputBytes}`;
    throw new Error(this.errorMessage);
  }
}

/**
 * The parser state.
 */
enum GrpcWebStreamParserState {
  INIT = 0, // expecting the next frame byte
  LENGTH = 1, // expecting 4 bytes of length
  MESSAGE = 2, // expecting more message bytes
  INVALID = 3,
}

/**
 * Possible frame byte
 */
// tslint:disable-next-line:no-namespace
export namespace GrpcWebStreamParser {
  export enum FrameType {
    DATA = 0x00, // expecting a data frame
    TRAILER = 0x80, // expecting a trailer frame
  }
}
