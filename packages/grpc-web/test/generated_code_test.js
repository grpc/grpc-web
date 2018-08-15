const assert = require('assert');
const execSync = require('child_process').execSync;
const commandExists = require('command-exists').sync;
const fs = require('fs');
const path = require('path');

var MockXMLHttpRequest = require('mock-xmlhttprequest').newMockXhr();
global.XMLHttpRequest = MockXMLHttpRequest;


describe('protoc generated code', function() {
  const genCodePath = path.resolve(__dirname, './echo_pb.js');
  const genCodeCmd = `protoc -I=./test echo.proto \
--js_out=import_style=commonjs:./test`

  before(function() {
    if (!commandExists('protoc')) {
      assert.fail('protoc is not installed');
    }
  });

  beforeEach(function() {
    if (fs.existsSync(genCodePath)) {
      fs.unlinkSync(genCodePath);
    }
  });

  afterEach(function() {
    if (fs.existsSync(genCodePath)) {
      fs.unlinkSync(genCodePath);
    }
  });

  it('should exist', function() {
    execSync(genCodeCmd);
    assert.equal(true, fs.existsSync(genCodePath));
  });

  it('should import', function() {
    execSync(genCodeCmd);
    const {EchoRequest} = require(genCodePath);
    var req = new EchoRequest();
    req.setMessage('abc');
    assert.equal('abc', req.getMessage());
  });
});


describe('grpc-web plugin generated code (commonjs+grpcwebtext)', function() {
  const protoGenCodePath = path.resolve(__dirname, './echo_pb.js');
  const genCodePath = path.resolve(__dirname, './echo_grpc_pb.js');
  const genCodeCmd = `protoc -I=./test echo.proto \
--js_out=import_style=commonjs:./test \
--grpc-web_out=import_style=commonjs,mode=grpcwebtext,out=echo_grpc_pb.js:\
./test`;

  before(function() {
    ['protoc', 'protoc-gen-grpc-web'].map(prog => {
      if (!commandExists(prog)) {
        assert.fail(`${prog} is not installed`);
      }
    });
  });

  beforeEach(function() {
    if (fs.existsSync(protoGenCodePath)) {
      fs.unlinkSync(protoGenCodePath);
    }
    if (fs.existsSync(genCodePath)) {
      fs.unlinkSync(genCodePath);
    }
  });

  afterEach(function() {
    if (fs.existsSync(protoGenCodePath)) {
      fs.unlinkSync(protoGenCodePath);
    }
    if (fs.existsSync(genCodePath)) {
      fs.unlinkSync(genCodePath);
    }
  });

  it('should exist', function() {
    execSync(genCodeCmd);
    assert.equal(true, fs.existsSync(genCodePath));
  });

  it('should import', function() {
    execSync(genCodeCmd);
    const {EchoServiceClient} = require(genCodePath);
    var echoService = new EchoServiceClient('Bla', null, null);
    assert.equal('function', typeof echoService.echo);
  });

  it('should send unary request', function(done) {
    execSync(genCodeCmd);
    const {EchoServiceClient} = require(genCodePath);
    const {EchoRequest} = require(protoGenCodePath);
    var echoService = new EchoServiceClient('MyHostname', null, null);
    var request = new EchoRequest();
    request.setMessage('aaa');
    MockXMLHttpRequest.onSend = function(xhr) {
      assert.equal('POST', xhr.method);
      // a single 'aaa' string, encoded
      assert.equal('AAAAAAUKA2FhYQ==', xhr.body);
      assert.equal('MyHostname/grpc.gateway.testing.EchoService/Echo',
        xhr.url);
      assert.equal(
        `accept: application/grpc-web-text\r\n\
content-type: application/grpc-web-text\r\n\
custom-header-1: value1\r\n\
x-grpc-web: 1\r\n\
x-user-agent: grpc-web-javascript/0.1\r\n`, xhr.requestHeaders.getAll());
      done();
    };
    echoService.echo(request, {'custom-header-1':'value1'});
  });

  it('should receive unary response', function(done) {
    execSync(genCodeCmd);
    const {EchoServiceClient} = require(genCodePath);
    const {EchoRequest} = require(protoGenCodePath);
    var echoService = new EchoServiceClient('MyHostname', null, null);
    var request = new EchoRequest();
    request.setMessage('aaa');
    MockXMLHttpRequest.onSend = function(xhr) {
      xhr.respond(200, {'Content-Type': 'application/grpc-web-text'},
        // a single data frame with 'aaa' message, encoded
        'AAAAAAUKA2FhYQ==');
    };
    echoService.echo(request, {'custom-header-1':'value1'},
      function(err, response) {
        assert.equal('aaa', response.getMessage());
        done();
      });
  });

  it('should receive streaming response', function(done) {
    execSync(genCodeCmd);
    const {EchoServiceClient} = require(genCodePath);
    const {ServerStreamingEchoRequest} = require(protoGenCodePath);
    var echoService = new EchoServiceClient('MyHostname', null, null);
    var request = new ServerStreamingEchoRequest();
    request.setMessage('aaa');
    request.setMessageCount(3);
    MockXMLHttpRequest.onSend = function(xhr) {
      xhr.respond(200, {'Content-Type': 'application/grpc-web-text'},
        // 3 'aaa' messages in 3 data frames, encoded
        'AAAAAAUKA2FhYQAAAAAFCgNhYWEAAAAABQoDYWFh');
    };
    var numMessagesReceived = 0;
    var p = new Promise(function(resolve, reject) {
      var stream = echoService.serverStreamingEcho(request,
        {'custom-header-1':'value1'});
      stream.on('data', function(response) {
        numMessagesReceived++;
        assert.equal('aaa', response.getMessage());
      });
      stream.on('end', function() {
        resolve();
      });
    });
    p.then(function(res) {
      assert.equal(3, numMessagesReceived);
      done();
    });
  });

  it('should receive trailing metadata', function(done) {
    execSync(genCodeCmd);
    const {EchoServiceClient} = require(genCodePath);
    const {EchoRequest} = require(protoGenCodePath);
    var echoService = new EchoServiceClient('MyHostname', null, null);
    var request = new EchoRequest();
    request.setMessage('aaa');
    MockXMLHttpRequest.onSend = function(xhr) {
      xhr.respond(200, {'Content-Type': 'application/grpc-web-text'},
        // a single data frame with an 'aaa' message, followed by,
        // a trailer frame with content 'grpc-status:0'
        'AAAAAAUKA2FhYYAAAAAPZ3JwYy1zdGF0dXM6MA0K');
    };
    var call = echoService.echo(request, {'custom-header-1':'value1'},
      function(err, response) {
        assert.equal('aaa', response.getMessage());
      });
    call.on('status', function(status) {
      assert.equal('object', typeof status.metadata);
      assert.equal(true, 'grpc-status' in status.metadata);
      assert.equal(0, parseInt(status.metadata['grpc-status']));
      done();
    });
  });

  it('should receive error', function(done) {
    execSync(genCodeCmd);
    const {EchoServiceClient} = require(genCodePath);
    const {EchoRequest} = require(protoGenCodePath);
    var echoService = new EchoServiceClient('MyHostname', null, null);
    var request = new EchoRequest();
    request.setMessage('aaa');
    MockXMLHttpRequest.onSend = function(xhr) {
      xhr.respond(200, {'Content-Type': 'application/grpc-web-text'},
        // a trailer frame with content 'grpc-status:10'
        'gAAAABBncnBjLXN0YXR1czoxMA0K');
    };
    var call = echoService.echo(request, {'custom-header-1':'value1'},
      function(err, response) {
        assert.equal(10, err.code);
        done();
      });
  });
});
