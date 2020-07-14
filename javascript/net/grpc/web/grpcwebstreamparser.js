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
/**
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
goog.module('grpc.web.GrpcWebStreamParser');

goog.module.declareLegacyNamespace();


const StreamParser = goog.require('goog.net.streams.StreamParser');
const asserts = goog.require('goog.asserts');



/**
 * The default grpc-web stream parser.
 * @implements {StreamParser}
 * @final
 */
class GrpcWebStreamParser {
  constructor() {
    /**
     * The current error message, if any.
     * @private {?string}
     */
    this.errorMessage_ = null;

    /**
     * The currently buffered result (parsed messages).
     * @private {!Array<!Object>}
     */
    this.result_ = [];

    /**
     * The current position in the streamed data.
     * @private {number}
     */
    this.streamPos_ = 0;

    /**
     * The current parser state.
     * @private {number}
     */
    this.state_ = Parser.State_.INIT;

    /**
     * The current frame byte being parsed
     * @private {number}
     */
    this.frame_ = 0;

    /**
     * The length of the proto message being parsed.
     * @private {number}
     */
    this.length_ = 0;

    /**
     * Count of processed length bytes.
     * @private {number}
     */
    this.countLengthBytes_ = 0;

    /**
     * Raw bytes of the current message. Uses Uint8Array by default. Falls back
     * to native array when Uint8Array is unsupported.
     * @private {?Uint8Array|?Array<number>}
     */
    this.messageBuffer_ = null;

    /**
     * Count of processed message bytes.
     * @private {number}
     */
    this.countMessageBytes_ = 0;
  }

  /**
   * @override
   */
  isInputValid() {
    return this.state_ != Parser.State_.INVALID;
  }

  /**
   * @override
   */
  getErrorMessage() {
    return this.errorMessage_;
  }

  /**
   * Parse the new input.
   *
   * Note that there is no Parser state to indicate the end of a stream.
   *
   * @param {string|!ArrayBuffer|!Uint8Array|!Array<number>} input The input
   *     data
   * @throws {!Error} Throws an error message if the input is invalid.
   * @return {?Array<string|!Object>} any parsed objects (atomic messages)
   *    in an array, or null if more data needs be read to parse any new object.
   * @override
   */
  parse(input) {
    asserts.assert(
        input instanceof Array || input instanceof ArrayBuffer ||
        input instanceof Uint8Array);

    var parser = this;
    var inputBytes;
    var pos = 0;

    if (input instanceof Uint8Array || input instanceof Array) {
      inputBytes = input;
    } else {
      inputBytes = new Uint8Array(input);
    }

    while (pos < inputBytes.length) {
      switch (parser.state_) {
        case Parser.State_.INVALID: {
          parser.error_(inputBytes, pos, 'stream already broken');
          break;
        }
        case Parser.State_.INIT: {
          processFrameByte(inputBytes[pos]);
          break;
        }
        case Parser.State_.LENGTH: {
          processLengthByte(inputBytes[pos]);
          break;
        }
        case Parser.State_.MESSAGE: {
          processMessageByte(inputBytes[pos]);
          break;
        }
        default: {
          throw new Error('unexpected parser state: ' + parser.state_);
        }
      }

      parser.streamPos_++;
      pos++;
    }

    var msgs = parser.result_;
    parser.result_ = [];
    return msgs.length > 0 ? msgs : null;

    /**
     * @param {number} b A frame byte to process
     */
    function processFrameByte(b) {
      if (b == FrameType.DATA) {
        parser.frame_ = b;
      } else if (b == FrameType.TRAILER) {
        parser.frame_ = b;
      } else {
        parser.error_(inputBytes, pos, 'invalid frame byte');
      }

      parser.state_ = Parser.State_.LENGTH;
      parser.length_ = 0;
      parser.countLengthBytes_ = 0;
    }

    /**
     * @param {number} b A length byte to process
     */
    function processLengthByte(b) {
      parser.countLengthBytes_++;
      parser.length_ = (parser.length_ << 8) + b;

      if (parser.countLengthBytes_ == 4) {  // no more length byte
        parser.state_ = Parser.State_.MESSAGE;
        parser.countMessageBytes_ = 0;
        if (typeof Uint8Array !== 'undefined') {
          parser.messageBuffer_ = new Uint8Array(parser.length_);
        } else {
          parser.messageBuffer_ = new Array(parser.length_);
        }

        if (parser.length_ == 0) {  // empty message
          finishMessage();
        }
      }
    }

    /**
     * @param {number} b A message byte to process
     */
    function processMessageByte(b) {
      parser.messageBuffer_[parser.countMessageBytes_++] = b;
      if (parser.countMessageBytes_ == parser.length_) {
        finishMessage();
      }
    }

    /**
     * Finishes up building the current message and resets parser state
     */
    function finishMessage() {
      var message = {};
      message[parser.frame_] = parser.messageBuffer_;
      parser.result_.push(message);
      parser.state_ = Parser.State_.INIT;
    }
  }
}


const Parser = GrpcWebStreamParser;


/**
 * The parser state.
 * @private @enum {number}
 */
Parser.State_ = {
  INIT: 0,     // expecting the next frame byte
  LENGTH: 1,   // expecting 4 bytes of length
  MESSAGE: 2,  // expecting more message bytes
  INVALID: 3
};


/**
 * Possible frame byte
 * @enum {number}
 */
GrpcWebStreamParser.FrameType = {
  DATA: 0x00,     // expecting a data frame
  TRAILER: 0x80,  // expecting a trailer frame
};


var FrameType = GrpcWebStreamParser.FrameType;



/**
 * @param {!Uint8Array|!Array<number>} inputBytes The current input buffer
 * @param {number} pos The position in the current input that triggers the error
 * @param {string} errorMsg Additional error message
 * @throws {!Error} Throws an error indicating where the stream is broken
 * @private
 */
Parser.prototype.error_ = function(inputBytes, pos, errorMsg) {
  this.state_ = Parser.State_.INVALID;
  this.errorMessage_ = 'The stream is broken @' + this.streamPos_ + '/' + pos +
      '. ' +
      'Error: ' + errorMsg + '. ' +
      'With input:\n' + inputBytes;
  throw new Error(this.errorMessage_);
};



exports = GrpcWebStreamParser;
