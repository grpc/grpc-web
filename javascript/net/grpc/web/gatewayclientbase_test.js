goog.provide('grpc.web.GatewayClientBaseTest');
goog.setTestOnly('grpc.web.GatewayClientBaseTest');

goog.require('goog.structs.Map');
goog.require('goog.testing.PropertyReplacer');
goog.require('goog.testing.asserts');
goog.require('goog.testing.jsunit');
goog.require('grpc.web.GatewayClientBase');


var propertyReplacer;
var dataCallback;


function setUp() {
  propertyReplacer = new goog.testing.PropertyReplacer();
  propertyReplacer.replace(
    goog.net.streams, 'createXhrNodeReadableStream',
    function(xhr) {
      return new MockXhrNodeReadableStream();
    });
}


function tearDown() {
  propertyReplacer.reset();
}


// { code: 3, message: 'TestErrorMsg' }
var RPC_STATUS_BYTES =
  [8, 3, 18, 12, 84, 101, 115, 116, 69, 114, 114, 111, 114, 77, 115, 103];
var REQUEST_BYTES = [1,2,3];
var FAKE_METHOD = "fake-method";
var DATA_BYTES = "woof";
var PROTO_FIELD_VALUE = "meow";
var EXPECTED_HEADERS = [
  "Content-Type",
  "X-Accept-Content-Transfer-Encoding",
  "X-Accept-Response-Streaming",
];
var EXPECTED_HEADER_VALUES = [
  "application/x-protobuf",
  "base64",
  "true",
];


/**
 * @constructor
 * @param {?Object} mockValues Set of mock values
 * Mock XhrIO object to test the outgoing values
 */
MockXhr = function(mockValues) {
  if (!('withMetadata' in mockValues)) {
    mockValues.headersCount = 3;
    mockValues.expectedHeaders = EXPECTED_HEADERS;
    mockValues.expectedHeaderValues = EXPECTED_HEADER_VALUES;
  } else {
    var expectedHeadersWithMetadata = EXPECTED_HEADERS.slice(0);
    var expectedHeaderValuesWithMetadata = EXPECTED_HEADER_VALUES.slice(0);
    expectedHeadersWithMetadata.push("header1");
    expectedHeaderValuesWithMetadata.push("value1");
    mockValues.headersCount = 4;
    mockValues.expectedHeaders = expectedHeadersWithMetadata;
    mockValues.expectedHeaderValues = expectedHeaderValuesWithMetadata;
  }
  this.mockValues = mockValues;
  this.headers = new goog.structs.Map();
};


/**
 * @param {string} url
 * @param {string=} opt_method
 * @param {string=} opt_content
 * @param {string=} opt_headers
 */
MockXhr.prototype.send = function(url, opt_method, opt_content, opt_headers) {
  assertEquals(FAKE_METHOD, url);
  assertEquals("POST", opt_method);
  assertElementsEquals(REQUEST_BYTES, opt_content);

  var headerKeys = this.headers.getKeys();
  var headerValues = this.headers.getValues();
  headerKeys.sort();
  headerValues.sort();
  assertEquals(this.mockValues.headersCount, this.headers.getCount());
  assertElementsEquals(this.mockValues.expectedHeaders, headerKeys);
  assertElementsEquals(this.mockValues.expectedHeaderValues, headerValues);
};


/**
 * @constructor
 * Mock XHR Node Readable Stream object
 */
MockXhrNodeReadableStream = function() {};


/**
 * @param {string} eventType
 * @param {function(?)} callback
 */
MockXhrNodeReadableStream.prototype.on = function(eventType, callback) {
  dataCallback = callback;
};


function testRpcResponse() {
  var client = new grpc.web.GatewayClientBase();
  client.newXhr_ = function() {
    return new MockXhr({});
  };
  client.rpcCall(FAKE_METHOD, {}, {}, {
    requestSerializeFn : function(request) {
      return REQUEST_BYTES;
    },
    responseDeserializeFn : function(bytes) {
      assertEquals(DATA_BYTES, bytes);
      return {"field1": PROTO_FIELD_VALUE};
    }
  }, function(error, response) {
    assertNull(error);
    assertEquals(PROTO_FIELD_VALUE, response.field1);
  });
  dataCallback({"1": DATA_BYTES});
}


function testRpcError() {
  var client = new grpc.web.GatewayClientBase();
  client.newXhr_ = function() {
    return new MockXhr({});
  };
  client.rpcCall(FAKE_METHOD, {}, {}, {
    requestSerializeFn : function(request) {
      return REQUEST_BYTES;
    },
    responseDeserializeFn : function(bytes) {
      return {};
    }
  }, function(error, response) {
    assertNull(response);
    assertEquals(3, error.code);
    assertEquals("TestErrorMsg", error.message);
  });
  dataCallback({"2": RPC_STATUS_BYTES});
}


function testRpcMetadata() {
  var client = new grpc.web.GatewayClientBase();
  client.newXhr_ = function() {
    return new MockXhr({
      withMetadata: true,
    });
  };
  client.rpcCall(FAKE_METHOD, {}, {"header1":"value1"}, {
    requestSerializeFn : function(request) {
      return REQUEST_BYTES;
    },
    responseDeserializeFn : function(bytes) {
      assertEquals(DATA_BYTES, bytes);
      return {"field1": PROTO_FIELD_VALUE};
    }
  }, function(error, response) {
    assertNull(error);
    assertEquals(PROTO_FIELD_VALUE, response.field1);
  });
  dataCallback({"1": DATA_BYTES});
}


function testStreamingResponse() {
  var client = new grpc.web.GatewayClientBase();
  var numCalled = 0;
  client.newXhr_ = function() {
    return new MockXhr({});
  };
  var stream = client.serverStreaming(FAKE_METHOD, {}, {}, {
    requestSerializeFn : function(request) {
      return REQUEST_BYTES;
    },
    responseDeserializeFn : function(bytes) {
      assertEquals(DATA_BYTES, bytes);
      return {"field1": PROTO_FIELD_VALUE};
    }
  });
  stream.on('data', function(response) {
    numCalled++;
    assertEquals(PROTO_FIELD_VALUE, response.field1);
  });
  assertEquals(0, numCalled);
  dataCallback({"1": DATA_BYTES});
  dataCallback({"1": DATA_BYTES});
  assertEquals(2, numCalled);
}


function testStreamingError() {
  var client = new grpc.web.GatewayClientBase();
  var numCalled = 0;
  client.newXhr_ = function() {
    return new MockXhr({});
  };
  var stream = client.serverStreaming(FAKE_METHOD, {}, {}, {
    requestSerializeFn : function(request) {
      return REQUEST_BYTES;
    },
    responseDeserializeFn : function(bytes) {
      return {};
    }
  });
  stream.on('data', function(response) {
    numCalled++;
  });
  stream.on('status', function(status) {
    assertEquals(3, status.code);
    assertEquals("TestErrorMsg", status.details);
  });
  dataCallback({"2": RPC_STATUS_BYTES});
  assertEquals(0, numCalled);
}


function testStreamingMetadata() {
  var client = new grpc.web.GatewayClientBase();
  var numCalled = 0;
  client.newXhr_ = function() {
    return new MockXhr({
      withMetadata: true,
    });
  };
  var stream = client.serverStreaming(FAKE_METHOD, {}, {"header1":"value1"}, {
    requestSerializeFn : function(request) {
      return REQUEST_BYTES;
    },
    responseDeserializeFn : function(bytes) {
      assertEquals(DATA_BYTES, bytes);
      return {"field1": PROTO_FIELD_VALUE};
    }
  });
  stream.on('data', function(response) {
    numCalled++;
    assertEquals(PROTO_FIELD_VALUE, response.field1);
  });
  dataCallback({"1": DATA_BYTES});
  dataCallback({"1": DATA_BYTES});
  assertEquals(2, numCalled);
}
