goog.provide('grpc.web.ClientBaseTest');
goog.setTestOnly('grpc.web.ClientBaseTest');

goog.require('goog.net.streams.NodeReadableStream');
goog.require('goog.net.streams.XhrNodeReadableStream');
goog.require('goog.structs.Map');
goog.require('goog.testing.PropertyReplacer');
goog.require('goog.testing.asserts');
goog.require('goog.testing.jsunit');
goog.require('grpc.web.ClientReadableStream');
goog.require('grpc.web.GatewayClientBase');


var client;
var callback;
var xhr;
var xhrReader;
var xhrStream;
var request;
var response;
var propertyReplacer;


/**
 * @type {Object} The NodeReadableStream EventType mapping
 */
var EventType = goog.net.streams.NodeReadableStream.EventType;


function setUp() {
  xhrReader = getMockXhrStreamReaderInstance();
  xhrStream = getMockXhrNodeReadableStreamInstance(xhrReader);

  propertyReplacer = new goog.testing.PropertyReplacer();
  propertyReplacer.replace(goog.net.streams,
                           'createXhrNodeReadableStream',
                           function (xhr) {
                             return xhrStream;
                           });
}


function tearDown() {
  propertyReplacer.reset();
}


/**
 * Constructs a duck-type XhrStreamReader to simulate xhr events.
 * @constructor
 * @struct
 * @final
 */
function MockXhrStreamReader() {

  // mocked API

  this.setStatusHandler = function(handler) {
    this.statusHandler_ = handler;
  };

  this.setDataHandler = function(handler) {
    this.dataHandler_ = handler;
  };

  this.getStatus = function() {
    return this.status_;
  };

  // simulated events

  this.onData = function(messages) {
    this.dataHandler_(messages);
  };

  this.onStatus = function(status) {
    this.status_ = status;
    this.statusHandler_();
  };
}


/**
 * Construct a mock Xhr object
 * @constructor
 * @struct
 * @final
 */
function MockXhr() {

  // mocked API

  this.headers = new goog.structs.Map();

  this.isActive = function() {
    return false;
  };

  this.send = function(url, method, content) {
    // doesn't need to do anything in test
  };
}


/**
 * Construct a mock Request proto object
 * @constructor
 * @struct
 * @final
 */
function MockRequest() {

  // mocked API

  this.serializeBinary = function() {
    return [];
  };
}


/**
 * Construct a mock Response proto object
 * @constructor
 * @struct
 * @final
 * @param {?Array=} opt_data The array of field values passed to the
 *   proto constructor
 */
MockReply = function(opt_data) {
  this.opt_data = opt_data;
}
/**
 * Mock deserializeBinary method
 * @param {?jspb.ByteSource} message The byte array
 * @return {!jspb.Message} the response proto
 */
MockReply.deserializeBinary = function(message) {
  return new MockReply([]);
}


/**
 * Return a client instance
 */
function getClientInstance() {
  return new grpc.web.GatewayClientBase();
}


/**
 * Return a mock Xhr instance
 */
function getMockXhrInstance() {
  return new MockXhr();
}


/**
 * Return a mock Request instance
 */
function getMockRequestInstance() {
  return new MockRequest();
}


/**
 * Return a mock Xhr Stream Reader instance
 */
function getMockXhrStreamReaderInstance() {
  return new MockXhrStreamReader();
}


/**
 * Return a mock Xhr Node Readable Stream instance
 * @param {!MockXhrStreamReader} xhrReader mock xhrReader instance
 */
function getMockXhrNodeReadableStreamInstance(xhrReader) {
  return new goog.net.streams.XhrNodeReadableStream(xhrReader);
}


/**
 * Return the mock grpc web Client
 */
function getMockClient() {
  client = getClientInstance();
  xhr = getMockXhrInstance();
  xhrReader = getMockXhrStreamReaderInstance();
  xhrStream = getMockXhrNodeReadableStreamInstance(xhrReader);

  // override with mock
  client.newXhr_ = function() {
    return xhr;
  };

  // override with mock
  client.getClientReadableStream_ = function(x, c) {
    return new grpc.web.ClientReadableStream(xhr,
                                             MockReply.deserializeBinary);
  }

  return client;
}

function testConstructor() {
  client = getClientInstance();
  assertTrue(client instanceof grpc.web.GatewayClientBase);
}

function testBasicRpcCall() {
  client = getMockClient();
  request = getMockRequestInstance();

  var delivered = false;

  callback = function(err, r) {
    delivered = true;
    response = r;
  };

  client.rpcCall('testMethod', request, {},
                 MockReply.deserializeBinary, callback);

  // callback should not have been invoked at this point
  assertFalse(delivered);
}

function testSetHeaders() {
  client = getMockClient();
  request = getMockRequestInstance();
  var metadata = {
    'header1': 'value 1',
    'header2': 'value 2',
  };

  var delivered = false;

  callback = function(err, r) {
    delivered = true;
    response = r;
  };

  client.rpcCall('testMethod', request, metadata,
                 MockReply.deserializeBinary, callback);

  // callback should not have been invoked at this point
  assertFalse(delivered);
  // Verify that headers were set on mock XhrIo.
  assertElementsEquals([
    'value 1',
    'value 2',
    'application/x-protobuf',
    'base64',
  ], xhr.headers.getValues());
}

function testRpcCallCallback() {
  client = getMockClient();
  request = getMockRequestInstance();

  var delivered = false;

  callback = function(err, r) {
    delivered = true;
    response = r;
  };

  client.rpcCall('testMethod', request, {},
                 MockReply.deserializeBinary, callback);

  // simulate server sending a response for this rpc call
  xhrReader.onData([{'1':'a'}]);

  // verify the callback is called
  assertTrue(delivered);

  // make sure the callback is called with the response proto
  // already deserialized
  assertTrue(response instanceof MockReply);
}


function testRpcCallResponse() {
  client = getMockClient();
  request = getMockRequestInstance();

  var delivered = false;

  callback = function(err, r) {
    delivered = true;
    response = r;
  };

  client.rpcCall('testMethod', request, {},
                 MockReply.deserializeBinary, callback);

  xhrReader.onData([{'1': 'v1'}]);

  assertTrue(delivered);
  assertTrue(response instanceof MockReply);
}


function testBasicServerStreaming() {
  client = getMockClient();
  request = getMockRequestInstance();

  var delivered = 0;

  var call = client.serverStreaming('testMethod', request, {},
                                    MockReply.deserializeBinary);

  assertTrue(call instanceof grpc.web.ClientReadableStream);

  // no callback has been attached yet
  assertEquals(0, delivered);
}


function testServerStreamingAddOnDataCallback() {
  client = getMockClient();
  request = getMockRequestInstance();

  var delivered = 0;

  callback = function(r) {
    delivered++;
    response = r;
  };

  var call = client.serverStreaming('testMethod', request, {},
                                    MockReply.deserializeBinary);

  assertTrue(call instanceof grpc.web.ClientReadableStream);
  assertEquals(0, delivered);

  call.on(EventType.DATA, callback);

  // callback should still not have been called at this point
  assertEquals(0, delivered);
}


function testServerStreamingCallback() {
  client = getMockClient();
  request = getMockRequestInstance();

  var delivered = 0;

  callback = function(r) {
    delivered++;
    response = r;
  };

  var call = client.serverStreaming('testMethod', request, {},
                                    MockReply.deserializeBinary);

  assertTrue(call instanceof grpc.web.ClientReadableStream);
  assertEquals(0, delivered);

  call.on(EventType.DATA, callback);

  // simulate server streaming 1 message
  xhrReader.onData([{'1': 'v'}]);

  // verify the callback is called
  assertEquals(1, delivered);

  // make sure the callback is called with the response proto
  // already deserialized
  assertTrue(response instanceof MockReply);
}


function testServerStreamingResponse() {
  client = getMockClient();
  request = getMockRequestInstance();

  var delivered = 0;

  callback = function(r) {
    delivered++;
    response = r;
  };

  var call = client.serverStreaming('testMethod', request, {},
                                    MockReply.deserializeBinary);

  assertTrue(call instanceof grpc.web.ClientReadableStream);
  assertEquals(0, delivered);

  call.on(EventType.DATA, callback);

  xhrReader.onData([{'1': 'v1'}]);

  assertEquals(1, delivered);
  assertTrue(response instanceof MockReply);
}


function testServerStreamingResponseMultipleMessages() {
  client = getMockClient();
  request = getMockRequestInstance();

  var delivered = 0;

  callback = function(r) {
    delivered++;
    response = r;
  };

  var call = client.serverStreaming('testMethod', request, {},
                                    MockReply.deserializeBinary);

  assertTrue(call instanceof grpc.web.ClientReadableStream);
  assertEquals(0, delivered);

  call.on(EventType.DATA, callback);

  // simulate the server sending multiple messages
  xhrReader.onData([{'1': 'v1'},{'1': 'v3'}]);

  // verify 2 messages got delivered
  assertEquals(2, delivered);
  assertTrue(response instanceof MockReply);
}
