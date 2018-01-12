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

goog.provide('grpc.web.GrpcWebStreamParser');

goog.require('goog.asserts');
goog.require('goog.net.streams.StreamParser');

goog.scope(function() {


/**
 * The default grpc-web stream parser.
 *
 * @constructor
 * @struct
 * @implements {goog.net.streams.StreamParser}
 * @final
 */
grpc.web.GrpcWebStreamParser = function() {
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
   * @private {grpc.web.GrpcWebStreamParser.State_}
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
   * Raw bytes of the current message. Uses Uint8Array by default. Falls back to
   * native array when Uint8Array is unsupported.
   * @private {?Uint8Array|?Array<number>}
   */
  this.messageBuffer_ = null;

  /**
   * Count of processed message bytes.
   * @private {number}
   */
  this.countMessageBytes_ = 0;
};


var Parser = grpc.web.GrpcWebStreamParser;


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
grpc.web.GrpcWebStreamParser.FrameType = {
  DATA:    0x00,   // expecting a data frame
  TRAILER: 0x80,   // expecting a trailer frame
};


var FrameType = grpc.web.GrpcWebStreamParser.FrameType;


/**
 * @override
 */
grpc.web.GrpcWebStreamParser.prototype.isInputValid = function() {
  return this.state_ != Parser.State_.INVALID;
};


/**
 * @override
 */
grpc.web.GrpcWebStreamParser.prototype.getErrorMessage = function() {
  return this.errorMessage_;
};


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


/**
 * @throws {!Error} Throws an error message if the input is invalid.
 * @override
 */
grpc.web.GrpcWebStreamParser.prototype.parse = function(input) {
  goog.asserts.assert(input instanceof Array || input instanceof ArrayBuffer);

  var parser = this;
  var inputBytes = (input instanceof Array) ? input : new Uint8Array(input);
  var pos = 0;

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
      default: { throw new Error('unexpected parser state: ' + parser.state_); }
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
};


});  // goog.scope
