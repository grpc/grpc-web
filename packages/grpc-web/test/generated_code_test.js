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

const assert = require('assert');
const execSync = require('child_process').execSync;
const commandExists = require('command-exists').sync;
const fs = require('fs');
const path = require('path');
const removeDirectory = require('./common.js').removeDirectory;
const GENERATED_CODE_PATH = require('./common.js').GENERATED_CODE_PATH;
const mockXmlHttpRequest = require('mock-xmlhttprequest');

var MockXMLHttpRequest;


describe('protoc generated code', function() {
  const genCodePath = path.resolve(__dirname, './echo_pb.js');
  const genCodeCmd = 'protoc -I=./test/protos echo.proto ' +
                     '--js_out=import_style=commonjs:./test';

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


describe('grpc-web generated code (commonjs+grpcwebtext)', function() {
  const oldXMLHttpRequest = global.XMLHttpRequest;

  const protoGenCodePath = path.resolve(__dirname, './echo_pb.js');
  const genCodePath = path.resolve(__dirname, './echo_grpc_web_pb.js');

  const genCodeCmd =
    'protoc -I=./test/protos echo.proto ' +
    '--js_out=import_style=commonjs:./test ' +
    '--grpc-web_out=import_style=commonjs,mode=grpcwebtext:./test';

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
    MockXMLHttpRequest = mockXmlHttpRequest.newMockXhr()
    global.XMLHttpRequest = MockXMLHttpRequest;
  });

  afterEach(function() {
    if (fs.existsSync(protoGenCodePath)) {
      fs.unlinkSync(protoGenCodePath);
    }
    if (fs.existsSync(genCodePath)) {
      fs.unlinkSync(genCodePath);
    }
    global.XMLHttpRequest = oldXMLHttpRequest;
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
        'accept: application/grpc-web-text\r\n' +
        'content-type: application/grpc-web-text\r\n' +
        'custom-header-1: value1\r\n' +
        'x-grpc-web: 1\r\n' +
        'x-user-agent: grpc-web-javascript/0.1\r\n',
        xhr.requestHeaders.getAll());
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
      var stream =
        echoService.serverStreamingEcho(request,
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
      xhr.respond(
        200, {'Content-Type': 'application/grpc-web-text'},
        // a single data frame with an 'aaa' message, followed by,
        // a trailer frame with content 'grpc-status: 0\d\ax-custom-1: ababab'
        'AAAAAAUKA2FhYYAAAAAkZ3JwYy1zdGF0dXM6IDANCngtY3VzdG9tLTE6IGFiYWJhYg0K');
    };
    var call = echoService.echo(request, {'custom-header-1':'value1'},
                                function(err, response) {
                                  assert.equal('aaa', response.getMessage());
                                });
    call.on('status', function(status) {
      assert.equal('object', typeof status.metadata);
      assert.equal(false, 'grpc-status' in status.metadata);
      assert.equal(true, 'x-custom-1' in status.metadata);
      assert.equal('ababab', status.metadata['x-custom-1']);
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

describe('grpc-web generated code (closure+grpcwebtext)', function() {
  const oldXMLHttpRequest = global.XMLHttpRequest;

  const compiledCodePath = path.resolve(__dirname, './generated/compiled.js');
  const genCodeCmd =
    'protoc -I=./test/protos echo.proto ' +
    '--js_out=import_style=closure:./test/generated ' +
    '--grpc-web_out=import_style=closure,mode=grpcwebtext:./test/generated';
  const cwd = process.cwd();
  const jsPaths = [
    ".",
    "../../../javascript",
    "../../../third_party/closure-library",
    "../../../third_party/grpc/third_party/protobuf/js",
  ].map(jsPath => path.relative(cwd, path.resolve(__dirname, jsPath)));
  const closureArgs = [].concat(
    jsPaths.map(jsPath => `--js=${jsPath}`),
    [
      `--entry_point=goog:proto.grpc.gateway.testing.EchoAppClient`,
      `--dependency_mode=PRUNE`,
      `--js_output_file ./test/generated/compiled.js`,
      `--output_wrapper="%output%module.exports = proto.grpc.gateway.testing;"`,
    ]
  );
  const closureCmd = "google-closure-compiler " + closureArgs.join(' ');

  before(function() {
    ['protoc', 'protoc-gen-grpc-web'].map(prog => {
      if (!commandExists(prog)) {
        assert.fail(`${prog} is not installed`);
      }
    });
    if (!fs.existsSync(path.resolve(
      __dirname, '../../../javascript/net/grpc/web/grpcwebclientbase.js'))) {
      this.skip();
    }
    removeDirectory(path.resolve(__dirname, GENERATED_CODE_PATH));
    fs.mkdirSync(path.resolve(__dirname, GENERATED_CODE_PATH));
  });

  beforeEach(function() {
    MockXMLHttpRequest = mockXmlHttpRequest.newMockXhr()
    global.XMLHttpRequest = MockXMLHttpRequest;
  });

  afterEach(function() {
    global.XMLHttpRequest = oldXMLHttpRequest;
  });

  after(function() {
    removeDirectory(path.resolve(__dirname, GENERATED_CODE_PATH));
  });

  it('should exist', function() {
    execSync(genCodeCmd);
    execSync(closureCmd);
    assert.equal(true, fs.existsSync(compiledCodePath));
  });

  it('should import', function() {
    var compiled = require(compiledCodePath);
    echoAppClient = new compiled.EchoAppClient();
    assert.equal('function', typeof echoAppClient.echo);
  });

  it('should send unary request', function(done) {
    var compiled = require(compiledCodePath);
    echoAppClient = new compiled.EchoAppClient();
    MockXMLHttpRequest.onSend = function(xhr) {
      assert.equal("AAAAAAUKA2FiYw==", xhr.body);
      done();
    }
    echoAppClient.echo('abc', () => {});
  });

  it('should receive unary response', function(done) {
    var compiled = require(compiledCodePath);
    echoAppClient = new compiled.EchoAppClient();
    MockXMLHttpRequest.onSend = function(xhr) {
      assert.equal("AAAAAAUKA2FiYw==", xhr.body);
      xhr.respond(200, {'Content-Type': 'application/grpc-web-text'},
                  "AAAAAAUKA2FiYw==");
    }
    echoAppClient.echo('abc', function(err, response) {
      assert.equal("abc", response.getMessage());
      done();
    });
  });
});


describe('grpc-web generated code (commonjs+dts)', function() {
  const protoGenCodePath = path.resolve(__dirname, './echo_pb.js');
  const protoDtsGenCodePath = path.resolve(__dirname, './echo_pb.d.ts');
  const genCodePath = path.resolve(__dirname, './echo_grpc_web_pb.js');
  const genDtsCodePath = path.resolve(__dirname, './echo_grpc_web_pb.d.ts');

  const genCodeCmd =
    'protoc -I=./test/protos echo.proto ' +
    '--js_out=import_style=commonjs:./test ' +
    '--grpc-web_out=import_style=commonjs+dts,mode=grpcwebtext:./test';

  before(function() {
    ['protoc', 'protoc-gen-grpc-web'].map(prog => {
      if (!commandExists(prog)) {
        assert.fail(`${prog} is not installed`);
      }
    });
  });

  beforeEach(function() {
    [protoGenCodePath, protoDtsGenCodePath,
     genCodePath, genDtsCodePath].map(f => {
       if (fs.existsSync(f)) {
         fs.unlinkSync(f);
       }
     });
  });

  afterEach(function() {
    [protoGenCodePath, protoDtsGenCodePath,
     genCodePath, genDtsCodePath].map(f => {
       if (fs.existsSync(f)) {
         fs.unlinkSync(f);
       }
     });
  });

  it('should exist', function() {
    execSync(genCodeCmd);
    assert.equal(true, fs.existsSync(genCodePath));
    assert.equal(true, fs.existsSync(genDtsCodePath));
    assert.equal(true, fs.existsSync(protoGenCodePath));
    assert.equal(true, fs.existsSync(protoDtsGenCodePath));
  });

  it('should compile', function() {
    execSync(genCodeCmd);
    execSync(`tsc ${genDtsCodePath}`);
    execSync(`tsc ${protoDtsGenCodePath}`);
  })
});
