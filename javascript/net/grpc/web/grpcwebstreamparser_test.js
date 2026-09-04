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
goog.module('grpc.web.GrpcWebStreamParserTest');
goog.setTestOnly('grpc.web.GrpcWebStreamParserTest');

var GrpcWebStreamParser = goog.require('grpc.web.GrpcWebStreamParser');
var testSuite = goog.require('goog.testing.testSuite');
goog.require('goog.testing.jsunit');

var parser;
var FrameType = GrpcWebStreamParser.FrameType;


testSuite({
  setUp: function() {
    parser = new GrpcWebStreamParser();
  },

  tearDown: function() {
  },

  testInvalidTagError: function() {
    var arr = new Uint8Array([1, 0]);
    assertThrows(function() { parser.parse(arr.buffer); });
  },

  testInvalidInputTypeInt: function() {
    assertThrows(function() { parser.parse(0); });
  },

  testInvalidInputTypeObject: function() {
    assertThrows(function() { parser.parse({}); });
  },

  testInvalidInputTypeString: function() {
    assertThrows(function() { parser.parse("abc"); });
  },

  testBasicMessage: function() {
    var arr = new Uint8Array([0, 0, 0, 0, 2, 38, 39]);
    var messages = parser.parse(arr.buffer);
    assertEquals(1, messages.length);

    var message = messages[0];
    assertTrue(FrameType.DATA in message);
    assertElementsEquals([38, 39], message[FrameType.DATA]);
  },

  testOneMessageOneTrailer: function() {
    var arr = new Uint8Array([0, 0, 0, 0, 2, 38, 39, 128, 0, 0, 0, 2, 40, 41]);
    var messages = parser.parse(arr.buffer);
    assertEquals(2, messages.length);

    var message = messages[0];
    assertTrue(FrameType.DATA in message);
    assertElementsEquals([38, 39], message[FrameType.DATA]);

    var trailer = messages[1];
    assertTrue(FrameType.TRAILER in trailer);
    assertElementsEquals([40, 41], trailer[FrameType.TRAILER]);
  },

  testMultipleMessageOneTrailer: function() {
    var arr = new Uint8Array([0, 0, 0, 0, 2, 38, 39, 0, 0, 0, 0, 3, 42, 43, 44,
                              128, 0, 0, 0, 2, 40, 41]);
    var messages = parser.parse(arr.buffer);
    assertEquals(3, messages.length);

    var message1 = messages[0];
    assertTrue(FrameType.DATA in message1);
    assertElementsEquals([38, 39], message1[FrameType.DATA]);

    var message2 = messages[1];
    assertTrue(FrameType.DATA in message2);
    assertElementsEquals([42, 43, 44], message2[FrameType.DATA]);

    var trailer = messages[2];
    assertTrue(FrameType.TRAILER in trailer);
    assertElementsEquals([40, 41], trailer[FrameType.TRAILER]);
  },

  testPartialMessage: function() {
    var arr = new Uint8Array([0, 0, 0, 0, 2, 38]);
    var messages = parser.parse(arr.buffer);
    assertNull(messages);

    arr = new Uint8Array([39]);
    messages = parser.parse(arr.buffer);
    assertEquals(1, messages.length);

    var message = messages[0];
    assertTrue(FrameType.DATA in message);
    assertElementsEquals([38, 39], message[FrameType.DATA]);
  },

  testMultiplePartialMessages: function() {
    var arr = new Uint8Array([0, 0, 0, 0, 2, 38]);
    var messages = parser.parse(arr.buffer);
    assertNull(messages);

    arr = new Uint8Array([39, 128, 0, 0]);
    messages = parser.parse(arr.buffer);
    assertEquals(1, messages.length);

    var message = messages[0];
    assertTrue(FrameType.DATA in message);
    assertElementsEquals([38, 39], message[FrameType.DATA]);

    arr = new Uint8Array([0, 3, 40]);
    messages = parser.parse(arr.buffer);
    assertNull(messages);

    arr = new Uint8Array([41, 42]);
    messages = parser.parse(arr.buffer);
    assertEquals(1, messages.length);

    var trailer = messages[0];
    assertTrue(FrameType.TRAILER in trailer);
    assertElementsEquals([40, 41, 42], trailer[FrameType.TRAILER]);
  },

  testTrailerOnly: function() {
    var arr = new Uint8Array([128, 0, 0, 0, 2, 40, 41]);
    var messages = parser.parse(arr.buffer);
    assertEquals(1, messages.length);

    var trailer = messages[0];
    assertTrue(FrameType.TRAILER in trailer);
    assertElementsEquals([40, 41], trailer[FrameType.TRAILER]);
  },

  testEmptyMessage: function() {
    var arr = new Uint8Array([0, 0, 0, 0, 0]);
    var messages = parser.parse(arr.buffer);
    assertEquals(1, messages.length);

    var message = messages[0];
    assertTrue(FrameType.DATA in message);
    assertElementsEquals([], message[FrameType.DATA]);
  },

  testEmptyMessageWithTrailer: function() {
    var arr = new Uint8Array([0, 0, 0, 0, 0, 128, 0, 0, 0, 1, 56]);
    var messages = parser.parse(arr.buffer);
    assertEquals(2, messages.length);

    var message = messages[0];
    assertTrue(FrameType.DATA in message);
    assertElementsEquals([], message[FrameType.DATA]);

    var trailer = messages[1];
    assertTrue(FrameType.TRAILER in trailer);
    assertElementsEquals([56], trailer[FrameType.TRAILER]);
  },

  testErrorAfterFirstMessage: function() {
    var arr = new Uint8Array([0, 0, 0, 0, 2, 38, 39]);
    var messages = parser.parse(arr.buffer);
    assertEquals(1, messages.length);

    var message = messages[0];
    assertTrue(FrameType.DATA in message);
    assertElementsEquals([38, 39], message[FrameType.DATA]);

    arr = new Uint8Array([1, 0]);
    assertThrows(function() { parser.parse(arr.buffer); });
  },

  testInvalidMessage: function() {
    var arr = new Uint8Array([0, 0, 0, 0, 2, 38, 39, 40, 0, 0, 0, 0, 2, 41, 42]);
    assertThrows(function() { parser.parse(arr.buffer); });
  },

  testEmptyArray: function() {
    var arr = new Uint8Array([]);
    var messages = parser.parse(arr.buffer);
    assertNull(messages);
  },

  testMessageAfterEmptyArray: function() {
    var arr = new Uint8Array([]);
    var messages = parser.parse(arr.buffer);
    assertNull(messages);

    arr = new Uint8Array([]);
    messages = parser.parse(arr.buffer);
    assertNull(messages);

    arr = new Uint8Array([0]);
    messages = parser.parse(arr.buffer);
    assertNull(messages);

    arr = new Uint8Array([]);
    messages = parser.parse(arr.buffer);
    assertNull(messages);

    arr = new Uint8Array([0, 0, 0]);
    messages = parser.parse(arr.buffer);
    assertNull(messages);

    arr = new Uint8Array([]);
    messages = parser.parse(arr.buffer);
    assertNull(messages);

    arr = new Uint8Array([2, 38, 39]);
    messages = parser.parse(arr.buffer);
    assertEquals(1, messages.length);

    var message = messages[0];
    assertTrue(FrameType.DATA in message);
    assertElementsEquals([38, 39], message[FrameType.DATA]);
  },

  // A message whose declared length is within the configured limit parses
  // normally and does not flag the stream as exceeded.
  testMessageLengthWithinLimit: function() {
    var boundedParser = new GrpcWebStreamParser(2);
    var arr = new Uint8Array([0, 0, 0, 0, 2, 38, 39]);  // DATA, length 2
    var messages = boundedParser.parse(arr.buffer);
    assertEquals(1, messages.length);
    assertElementsEquals([38, 39], messages[0][FrameType.DATA]);
    assertFalse(boundedParser.getMessageLengthExceeded());
    assertTrue(boundedParser.isInputValid());
  },

  // A frame declaring a length greater than the configured maximum is rejected
  // on the length prefix alone -- the body is withheld here, mirroring the DoS
  // vector -- before any receive buffer is allocated. The stream is marked
  // invalid and flagged so the caller can surface RESOURCE_EXHAUSTED.
  testMessageLengthExceedsLimit: function() {
    var boundedParser = new GrpcWebStreamParser(2);
    var header = new Uint8Array([0, 0, 0, 0, 3]);  // DATA, length 3, no body
    var err = assertThrows(function() {
      boundedParser.parse(header.buffer);
    });
    assertTrue(boundedParser.getMessageLengthExceeded());
    assertFalse(boundedParser.isInputValid());
    assertTrue(
        err.message.indexOf('exceeds max receive message size') != -1);
  },

  // The exact reported vector: a DATA frame advertising 0x7fffffff (~2 GB) with
  // the body withheld must be rejected by the default 4 MB parser.
  testDefaultLimitRejectsOversizedLength: function() {
    var header = new Uint8Array([0, 127, 255, 255, 255]);  // length 0x7fffffff
    assertThrows(function() { parser.parse(header.buffer); });
    assertTrue(parser.getMessageLengthExceeded());
  },

  // 0x80000000 has the high bit set. A signed `<< 8` decode would read this as
  // negative and slip past the `> max` check (then attempt a negative-size
  // allocation); the unsigned decode treats it as ~2 GB and rejects it.
  testLengthPrefixDecodedAsUnsigned: function() {
    var boundedParser = new GrpcWebStreamParser(1024);
    var header = new Uint8Array([0, 128, 0, 0, 0]);  // length 0x80000000
    assertThrows(function() { boundedParser.parse(header.buffer); });
    assertTrue(boundedParser.getMessageLengthExceeded());
  },

  // A maximum of 0 disables the check; normal messages still parse.
  testZeroMaxDisablesLimit: function() {
    var unlimitedParser = new GrpcWebStreamParser(0);
    var arr = new Uint8Array([0, 0, 0, 0, 2, 38, 39]);
    var messages = unlimitedParser.parse(arr.buffer);
    assertEquals(1, messages.length);
    assertFalse(unlimitedParser.getMessageLengthExceeded());
  },

});
