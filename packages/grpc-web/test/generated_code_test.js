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

function multiDone(done, count) {
  return function() {
    count -= 1;
    if (count <= 0) {
      done();
    }
  };
}

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

describe('grpc-web generated code: promise-based client', function() {
  const protoGenCodePath = path.resolve(__dirname, './echo_pb.js');
  const genCodePath = path.resolve(__dirname, './echo_grpc_web_pb.js');

  const genCodeCmd =
    'protoc -I=./test/protos echo.proto ' +
    '--js_out=import_style=commonjs:./test ' +
    '--grpc-web_out=import_style=commonjs,mode=grpcwebtext:./test';

  before(function() {
    MockXMLHttpRequest = mockXmlHttpRequest.newMockXhr()
    global.XMLHttpRequest = MockXMLHttpRequest;

    execSync(genCodeCmd);
    assert.equal(true, fs.existsSync(protoGenCodePath));
    assert.equal(true, fs.existsSync(genCodePath));
  });

  after(function() {
    fs.unlinkSync(protoGenCodePath);
    fs.unlinkSync(genCodePath);
  });

  it('should receive unary response', function(done) {
    const {EchoServicePromiseClient} = require(genCodePath);
    const {EchoRequest} = require(protoGenCodePath);
    var echoService = new EchoServicePromiseClient('MyHostname', null, null);
    var request = new EchoRequest();
    request.setMessage('aaa');

    MockXMLHttpRequest.onSend = function(xhr) {
      // a single data frame with message 'aaa'
      assert.equal("AAAAAAUKA2FhYQ==", xhr.body);
      xhr.respond(
        200, {'Content-Type': 'application/grpc-web-text'},
        // a single data frame with message 'aaa'
        'AAAAAAUKA2FhYQ==');
    };
    echoService.echo(request, {})
               .then((response) => {
                 assert.equal('aaa', response.getMessage());
                 done();
               });
  });

  it('should receive error', function(done) {
    const {EchoServicePromiseClient} = require(genCodePath);
    const {EchoRequest} = require(protoGenCodePath);
    var echoService = new EchoServicePromiseClient('MyHostname', null, null);
    var request = new EchoRequest();
    request.setMessage('aaa');

    MockXMLHttpRequest.onSend = function(xhr) {
      xhr.respond(
        400, {'Content-Type': 'application/grpc-web-text'});
    };
    echoService.echo(request, {})
               .then((response) => {
                 assert.fail('should not receive response');
               })
               .catch((error) => {
                 assert.equal(3, error.code);
                 done();
               });
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
    var call = echoService.echo(request, {'custom-header-1':'value1'},
                                function(err, response) {
                                  assert.equal('aaa', response.getMessage());
                                  done();
    });
    call.on('data', (response) => {
      assert.fail('should not receive response this way');
    });
  });

  it('should receive streaming response', function(done) {
    done = multiDone(done, 4); // done() should be called 4 times
    execSync(genCodeCmd);
    const {EchoServiceClient} = require(genCodePath);
    const {ServerStreamingEchoRequest} = require(protoGenCodePath);
    var echoService = new EchoServiceClient('MyHostname', null, null);
    var request = new ServerStreamingEchoRequest();
    request.setMessage('aaa');
    request.setMessageCount(3);
    MockXMLHttpRequest.onSend = function(xhr) {
      // a proto message of 1: "aaa", 2: 3, base64-encoded
      assert.equal("AAAAAAcKA2FhYRAD", xhr.body);
      xhr.respond(200, {'Content-Type': 'application/grpc-web-text'},
                  // 3 'aaa' messages in 3 data frames, encoded
                  'AAAAAAUKA2FhYQAAAAAFCgNhYWEAAAAABQoDYWFh');
    };
    var stream = echoService.serverStreamingEcho(request, {});
    stream.on('data', function(response) {
      assert.equal('aaa', response.getMessage());
      done();
    });
    stream.on('end', function() {
      done();
    });
  });

  it('should receive trailing metadata', function(done) {
    done = multiDone(done, 2);
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
        'AAAAAAUKA2FhYYAAAAAkZ3JwYy1zdGF0dXM6IDANCngtY3VzdG9tLTE6IGFiYWJhYg0K'
      );
    };
    var call = echoService.echo(
      request, {'custom-header-1':'value1'},
      function(err, response) {
        if (err) {
          assert.fail('should not receive error');
        }
        assert(response);
        assert.equal('aaa', response.getMessage());
        done();
    });
    call.on('status', function(status) {
      assert.equal(0, status.code);
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
    var call = echoService.echo(
      request, {'custom-header-1':'value1'},
      function(err, response) {
        if (response) {
          assert.fail('should not have received response');
        }
        assert(err);
        assert.equal(10, err.code);
        done();
    });
    call.on('error', (error) => {
      assert.fail('error callback should not be called for unary calls');
    });
  });

  it('should error out on incomplete response', function(done) {
    execSync(genCodeCmd);
    const {EchoServiceClient} = require(genCodePath);
    const {EchoRequest} = require(protoGenCodePath);
    var echoService = new EchoServiceClient('MyHostname', null, null);
    var request = new EchoRequest();
    MockXMLHttpRequest.onSend = function(xhr) {
      xhr.respond(200, {'Content-Type': 'application/grpc-web-text'},
                  // An incomplete response. The frame length indicates
                  // 26 bytes, but the rest of the frame only contains
                  // 18 bytes.
                  'AAAAABoKCwgBEgdGaWN0aW9uCgsIAhI');
    };
    var call = echoService.echo(
      request, {}, function(err, response) {
        if (response) {
          assert.fail('should not receive response');
        }
        assert.equal(2, err.code);
        assert.equal(true, err.message.toLowerCase().includes(
          'incomplete response'));
        done();
    });
    call.on('data', (response) => {
      assert.fail('should not receive response this way');
    });
    call.on('error', (error) => {
      assert.fail('should not receive error this way');
    });
  });

  it('should error out on invalid proto response', function(done) {
    execSync(genCodeCmd);
    const {EchoServiceClient} = require(genCodePath);
    const {EchoRequest} = require(protoGenCodePath);
    var echoService = new EchoServiceClient('MyHostname', null, null);
    var request = new EchoRequest();
    MockXMLHttpRequest.onSend = function(xhr) {
      xhr.respond(200, {'Content-Type': 'application/grpc-web-text'},
                  // A valid grpc-web frame, but contains an invalid
                  // protobuf payload.
                  'AAAAAAUKCgoKCg==');
    };
    var call = echoService.echo(
      request, {}, function(err, response) {
        if (response) {
          assert.fail('should not receive response');
        }
        assert.equal(2, err.code);
        assert.equal(true, err.message.toLowerCase().includes('deserialize'));
        assert.equal(true, err.message.toLowerCase().includes('error'));
        done();
    });
    call.on('data', (response) => {
      assert.fail('should not receive response this way');
    });
    call.on('error', (error) => {
      assert.fail('should not receive error this way');
    });
  });

  it('should error out on invalid response body', function(done) {
    execSync(genCodeCmd);
    const {EchoServiceClient} = require(genCodePath);
    const {EchoRequest} = require(protoGenCodePath);
    var echoService = new EchoServiceClient('MyHostname', null, null);
    var request = new EchoRequest();
    MockXMLHttpRequest.onSend = function(xhr) {
      xhr.respond(200, {'Content-Type': 'application/grpc-web-text'},
                  // An invalid response body. Should trip up in the
                  // stream parser.
                  'ZZZZZ');
    };
    var call = echoService.echo(
      request, {}, function(err, response) {
        if (response) {
          assert.fail('should not receive response');
        }
        assert.equal(2, err.code);
        assert.equal(true, err.message.toLowerCase().includes(
          'error in parsing response body'));
        done();
    });
    call.on('data', (response) => {
      assert.fail('should not receive response this way');
    });
    call.on('error', (error) => {
      assert.fail('should not receive error this way');
    });
  });

  it('should not receive response on non-ok status', function(done) {
    done = multiDone(done, 2);
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
        // a trailer frame with content 'grpc-status: 2\d\ax-custom-1: ababab'
        'AAAAAAUKA2FhYYAAAAAkZ3JwYy1zdGF0dXM6IDINCngtY3VzdG9tLTE6IGFiYWJhYg0K'
      );
    };
    var call = echoService.echo(
      request, {'custom-header-1':'value1'},
      function(err, response) {
        if (response) {
          assert.fail('should not have received response with non-OK status');
        } else {
          assert.equal(2, err.code);
        }
        done();
      });
    call.on('status', function(status) {
      assert.equal(2, status.code);
      assert.equal('object', typeof status.metadata);
      assert.equal(false, 'grpc-status' in status.metadata);
      assert.equal(true, 'x-custom-1' in status.metadata);
      assert.equal('ababab', status.metadata['x-custom-1']);
      done();
    });
    call.on('error', (error) => {
      assert.fail('error callback should not be called for unary calls');
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
      `--output_wrapper="%output%module.exports = `+
      `proto.grpc.gateway.testing;"`,
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

describe('grpc-web generated code: callbacks tests', function() {
  const protoGenCodePath = path.resolve(__dirname, './echo_pb.js');
  const genCodePath = path.resolve(__dirname, './echo_grpc_web_pb.js');

  const genCodeCmd =
    'protoc -I=./test/protos echo.proto ' +
    '--js_out=import_style=commonjs:./test ' +
    '--grpc-web_out=import_style=commonjs,mode=grpcwebtext:./test';

  var echoService;
  var request;

  before(function() {
    MockXMLHttpRequest = mockXmlHttpRequest.newMockXhr()
    global.XMLHttpRequest = MockXMLHttpRequest;

    execSync(genCodeCmd);
    const {EchoServiceClient} = require(genCodePath);
    const {EchoRequest} = require(protoGenCodePath);
    echoService = new EchoServiceClient('MyHostname', null, null);
    request = new EchoRequest();
    request.setMessage('aaa');
  });

  after(function() {
    if (fs.existsSync(protoGenCodePath)) {
      fs.unlinkSync(protoGenCodePath);
    }
    if (fs.existsSync(genCodePath)) {
      fs.unlinkSync(genCodePath);
    }
  });

  it('should receive initial metadata callback', function(done) {
    done = multiDone(done, 2);
    MockXMLHttpRequest.onSend = function(xhr) {
      xhr.respond(
        200, {
          'Content-Type': 'application/grpc-web-text',
          'initial-header-1': 'value1',
        },
        // a single data frame with message 'aaa'
        'AAAAAAUKA2FhYQ==');
    };
    var call = echoService.echo(
      request, {},
      function(err, response) {
        if (err) {
          assert.fail('should not have received error');
        } else {
          assert.equal('aaa', response.getMessage());
        }
        done();
      }
    );
    call.on('metadata', (metadata) => {
      assert('initial-header-1' in metadata);
      assert.equal('value1', metadata['initial-header-1']);
      done();
    });
  });

  it('should receive error, on http error', function(done) {
    done = multiDone(done, 2);
    MockXMLHttpRequest.onSend = function(xhr) {
      xhr.respond(
        400, {'Content-Type': 'application/grpc-web-text'});
    };
    var call = echoService.echo(
      request, {},
      function(err, response) {
        if (response) {
          assert.fail('should not have received response with non-OK status');
        } else {
          assert.equal(3, err.code); // http error 400 mapped to grpc error 3
        }
        done();
      }
    );
    call.on('status', (status) => {
      assert.equal(3, status.code);
      done();
    });
    call.on('error', (error) => {
      assert.fail('error callback should not be called for unary calls');
    });
  });

  it('should receive error, on grpc error', function(done) {
    done = multiDone(done, 2);
    MockXMLHttpRequest.onSend = function(xhr) {
      xhr.respond(
        200, {'Content-Type': 'application/grpc-web-text'},
        // a single data frame with an 'aaa' message, followed by,
        // a trailer frame with content 'grpc-status: 2\d\ax-custom-1: ababab'
        'AAAAAAUKA2FhYYAAAAAkZ3JwYy1zdGF0dXM6IDINCngtY3VzdG9tLTE6IGFiYWJhYg0K'
      );
    };
    var call = echoService.echo(
      request, {},
      function(err, response) {
        if (response) {
          assert.fail('should not have received response with non-OK status');
        } else {
          assert.equal(2, err.code);
          assert.equal(true, 'x-custom-1' in err.metadata);
          assert.equal('ababab', err.metadata['x-custom-1']);
        }
        done();
      }
    );
    // also should receive trailing status callback
    call.on('status', (status) => {
      // grpc-status should not be part of trailing metadata
      assert.equal(false, 'grpc-status' in status.metadata);
      assert.equal(true, 'x-custom-1' in status.metadata);
      assert.equal('ababab', status.metadata['x-custom-1']);
      done();
    });
    call.on('error', (error) => {
      assert.fail('error callback should not be called for unary calls');
    });
  });

  it('should receive error, on response header error', function(done) {
    done = multiDone(done, 2);
    MockXMLHttpRequest.onSend = function(xhr) {
      xhr.respond(
        200, {
          'Content-Type': 'application/grpc-web-text',
          'grpc-status': 2,
          'grpc-message': 'some error',
      });
    };
    var call = echoService.echo(
      request, {},
      function(err, response) {
        if (response) {
          assert.fail('should not have received response with non-OK status');
        } else {
          assert.equal(2, err.code);
          assert.equal('some error', err.message);
        }
        done();
      }
    );
    call.on('status', (status) => {
      assert.equal(2, status.code);
      done();
    });
    call.on('error', (error) => {
      assert.fail('error callback should not be called for unary calls');
    });
  });

  it('should receive status callback', function(done) {
    done = multiDone(done, 2);
    MockXMLHttpRequest.onSend = function(xhr) {
      xhr.respond(
        200, {'Content-Type': 'application/grpc-web-text'},
        // a single data frame with an 'aaa' message, followed by,
        // a trailer frame with content 'grpc-status: 0\d\ax-custom-1: ababab'
        'AAAAAAUKA2FhYYAAAAAkZ3JwYy1zdGF0dXM6IDANCngtY3VzdG9tLTE6IGFiYWJhYg0K'
      );
    };
    var call = echoService.echo(
      request, {},
      function(err, response) {
        if (err) {
          assert.fail('should not receive error');
        }
        assert(response);
        assert.equal('aaa', response.getMessage());
        done();
      }
    );
    call.on('status', (status) => {
      assert.equal(0, status.code);
      // grpc-status should not be part of trailing metadata
      assert.equal(false, 'grpc-status' in status.metadata);
      assert.equal(true, 'x-custom-1' in status.metadata);
      assert.equal('ababab', status.metadata['x-custom-1']);
      done();
    });
    call.on('error', (error) => {
      assert.fail('error callback should not be called for unary calls');
    });
  });

  it('should trigger multiple callbacks on same event', function(done) {
    done = multiDone(done, 2);
    MockXMLHttpRequest.onSend = function(xhr) {
      xhr.respond(
        400, {'Content-Type': 'application/grpc-web-text'});
    };
    var call = echoService.serverStreamingEcho(request, {});

    call.on('data', (response) => {
      assert.fail('should not have received a data callback');
    });
    call.on('error', (error) => {
      assert.equal(3, error.code); // http error 400 mapped to grpc error 3
      done();
    });
    call.on('error', (error) => {
      assert.equal(3, error.code); // http error 400 mapped to grpc error 3
      done();
    });
  });

  it('should be able to remove callback', function(done) {
    MockXMLHttpRequest.onSend = function(xhr) {
      xhr.respond(
        400, {'Content-Type': 'application/grpc-web-text'});
    };
    var call = echoService.serverStreamingEcho(request, {});
    const callbackA = (error) => {
      assert.equal(3, error.code); // http error 400 mapped to grpc error 3
      done();
    }
    const callbackB = (error) => {
      assert.fail('should not be called');
    }
    call.on('error', callbackA);
    call.on('error', callbackB);
    call.removeListener('error', callbackB);
  });

  it('should receive initial metadata callback (streaming)', function(done) {
    done = multiDone(done, 2);
    MockXMLHttpRequest.onSend = function(xhr) {
      xhr.respond(
        200, {
          'Content-Type': 'application/grpc-web-text',
          'initial-header-1': 'value1',
        },
        // a single data frame with message 'aaa'
        'AAAAAAUKA2FhYQ==');
    };
    var call = echoService.serverStreamingEcho(request, {});
    call.on('data', (response) => {
      assert.equal('aaa', response.getMessage());
      done();
    });
    call.on('metadata', (metadata) => {
      assert('initial-header-1' in metadata);
      assert.equal('value1', metadata['initial-header-1']);
      done();
    });
  });

  it('should receive error, on http error (streaming)', function(done) {
    done = multiDone(done, 2);
    MockXMLHttpRequest.onSend = function(xhr) {
      xhr.respond(
        400, {'Content-Type': 'application/grpc-web-text'});
    };
    var call = echoService.serverStreamingEcho(request, {});
    call.on('data', (response) => {
      assert.fail('should not receive data response');
    });
    call.on('status', (status) => {
      assert.equal(3, status.code);
      done();
    });
    call.on('error', (error) => {
      assert.equal(3, error.code);
      done();
    });
  });

  it('should receive error, on grpc error (streaming)', function(done) {
    done = multiDone(done, 3);
    MockXMLHttpRequest.onSend = function(xhr) {
      xhr.respond(
        200, {'Content-Type': 'application/grpc-web-text'},
        // a single data frame with an 'aaa' message, followed by,
        // a trailer frame with content 'grpc-status: 2\d\ax-custom-1: ababab'
        'AAAAAAUKA2FhYYAAAAAkZ3JwYy1zdGF0dXM6IDINCngtY3VzdG9tLTE6IGFiYWJhYg0K'
      );
    };
    var call = echoService.serverStreamingEcho(request, {});
    call.on('data', (response) => {
      // because this is a streaming call, we should still receive data
      // callbacks if the error comes in with the trailer frame
      assert.equal('aaa', response.getMessage());
      done();
    });
    call.on('error', (error) => {
      assert.equal(2, error.code);
      assert.equal(true, 'x-custom-1' in error.metadata);
      assert.equal('ababab', error.metadata['x-custom-1']);
      done();
    });
    call.on('status', (status) => {
      assert.equal(2, status.code);
      // grpc-status should not be part of trailing metadata
      assert.equal(false, 'grpc-status' in status.metadata);
      assert.equal(true, 'x-custom-1' in status.metadata);
      assert.equal('ababab', status.metadata['x-custom-1']);
      done();
    });
  });

  it('should receive error, on response header error (streaming)',
     function(done) {
    done = multiDone(done, 2);
    MockXMLHttpRequest.onSend = function(xhr) {
      xhr.respond(
        200, {
          'Content-Type': 'application/grpc-web-text',
          'grpc-status': 2,
          'grpc-message': 'some error',
      });
    };
    var call = echoService.serverStreamingEcho(request, {});
    call.on('error', (error) => {
      assert.equal(2, error.code);
      assert.equal('some error', error.message);
      done();
    });
    call.on('status', (status) => {
      assert.equal(2, status.code);
      assert.equal('some error', status.details);
      done();
    });
  });

  it('should receive status callback (streaming)', function(done) {
    done = multiDone(done, 2);
    MockXMLHttpRequest.onSend = function(xhr) {
      xhr.respond(
        200, {'Content-Type': 'application/grpc-web-text'},
        // a single data frame with an 'aaa' message, followed by,
        // a trailer frame with content 'grpc-status: 0\d\ax-custom-1: ababab'
        'AAAAAAUKA2FhYYAAAAAkZ3JwYy1zdGF0dXM6IDANCngtY3VzdG9tLTE6IGFiYWJhYg0K'
      );
    };
    var call = echoService.serverStreamingEcho(request, {});
    call.on('data', (response) => {
        assert(response);
        assert.equal('aaa', response.getMessage());
        done();
    });
    call.on('status', (status) => {
      assert.equal(0, status.code);
      // grpc-status should not be part of trailing metadata
      assert.equal(false, 'grpc-status' in status.metadata);
      assert.equal(true, 'x-custom-1' in status.metadata);
      assert.equal('ababab', status.metadata['x-custom-1']);
      done();
    });
    call.on('error', (error) => {
      assert.fail('error callback should not be called for unary calls');
    });
  });

});
