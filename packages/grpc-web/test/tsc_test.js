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
const fs = require('fs');
const path = require('path');
const removeDirectory = require('./common.js').removeDirectory;
const mockXmlHttpRequest = require('mock-xmlhttprequest');

var MockXMLHttpRequest;

function relativePath(relPath) {
  return path.resolve(__dirname, relPath);
}
function cleanup() {
  removeDirectory(relativePath('./tsc-tests/dist'));
  removeDirectory(relativePath('./tsc-tests/generated'));
}
function createGeneratedCodeDir() {
  fs.mkdirSync(relativePath('./tsc-tests/generated'));
}
function assertFileExists(relPath) {
  assert.equal(true, fs.existsSync(relativePath(relPath)));
}
function multiDone(done, count) {
  return function() {
    count -= 1;
    if (count <= 0) {
      done();
    }
  };
}
function runTscCmd(tscCmd) {
  try {
    execSync(tscCmd, {cwd: relativePath('./tsc-tests')});
  } catch (e) {
    assert.fail(e.stdout);
  }
}
const outputDir = './test/tsc-tests/generated';
const tscCompilerOptions = `--allowJs --strict --noImplicitReturns`

describe('tsc test01: nested messages', function() {
  before(function() {
    cleanup();
    createGeneratedCodeDir();
    execSync(`protoc -I=./test/protos test01.proto \
      --js_out=import_style=commonjs:${outputDir} \
      --grpc-web_out=import_style=commonjs+dts,mode=grpcwebtext:${outputDir}`);
  });

  after(function() {
    cleanup();
  });

  it('generated code should exist', function() {
    assertFileExists('./tsc-tests/generated/test01_pb.js');
    assertFileExists('./tsc-tests/generated/test01_pb.d.ts');
  });

  it('tsc should run and export', function() {
    runTscCmd(`tsc client01.ts generated/test01_pb.d.ts generated/test01_pb.js \
      ${tscCompilerOptions} --outDir ./dist`);

    // check for the tsc output
    assertFileExists('./tsc-tests/dist/client01.js');
    assertFileExists('./tsc-tests/dist/generated/test01_pb.js');

    // load the compiled js files and do some tests
    const {msgOuter} = require(relativePath('./tsc-tests/dist/client01.js'));
    assert.equal(123, msgOuter.getSomepropList()[0].getValue());
  });
});

describe('tsc test02: simple rpc, messages in separate proto', function() {
  before(function() {
    cleanup();
    createGeneratedCodeDir();
    MockXMLHttpRequest = mockXmlHttpRequest.newMockXhr();
    global.XMLHttpRequest = MockXMLHttpRequest;
    execSync(`protoc -I=./test/protos test02.proto test03.proto \
      --js_out=import_style=commonjs:${outputDir} \
      --grpc-web_out=import_style=typescript,mode=grpcwebtext:${outputDir}`);
  });

  after(function() {
    cleanup();
  });

  it('generated code should exist', function() {
    assertFileExists('./tsc-tests/generated/Test02ServiceClientPb.ts');
    assertFileExists('./tsc-tests/generated/test02_pb.js');
    assertFileExists('./tsc-tests/generated/test02_pb.d.ts');
    assertFileExists('./tsc-tests/generated/test03_pb.js');
    assertFileExists('./tsc-tests/generated/test03_pb.d.ts');
  });

  it('tsc should run and export', function(done) {
    runTscCmd(`tsc client02.ts generated/Test02ServiceClientPb.ts \
      generated/test02_pb.d.ts generated/test02_pb.js \
      generated/test03_pb.d.ts generated/test03_pb.js \
      ${tscCompilerOptions} --outDir ./dist`);

    // check for the tsc output
    assertFileExists('./tsc-tests/dist/client02.js');
    assertFileExists('./tsc-tests/dist/generated/Test02ServiceClientPb.js');
    assertFileExists('./tsc-tests/dist/generated/test02_pb.js');
    assertFileExists('./tsc-tests/dist/generated/test03_pb.js');

    // load the compiled js files and do some tests
    MockXMLHttpRequest.onSend = function(xhr) {
      assert.equal('http://mydummy.com/MyService/addOne', xhr.url);
      assert.equal('AAAAAAA=', xhr.body);
      done();
    };
    require(relativePath('./tsc-tests/dist/client02.js'));
  });
});

describe('tsc test03: streamInterceptor', function() {
  before(function() {
    cleanup();
    createGeneratedCodeDir();
    MockXMLHttpRequest = mockXmlHttpRequest.newMockXhr();
    global.XMLHttpRequest = MockXMLHttpRequest;
    const genCmd = `protoc -I=./test/protos echo.proto \
      --js_out=import_style=commonjs:${outputDir} \
      --grpc-web_out=import_style=commonjs+dts,mode=grpcwebtext:${outputDir}`;
    execSync(genCmd);
  });

  after(function() {
    cleanup();
  });

  it('generated code should exist', function() {
    assertFileExists('./tsc-tests/generated/echo_pb.js');
    assertFileExists('./tsc-tests/generated/echo_pb.d.ts');
    assertFileExists('./tsc-tests/generated/echo_grpc_web_pb.js');
    assertFileExists('./tsc-tests/generated/echo_grpc_web_pb.d.ts');
  });

  it('tsc should run and export', function(done) {
    done = multiDone(done, 3);
    const tscCmd = `tsc client03.ts \
      generated/echo_pb.d.ts generated/echo_pb.js \
      generated/echo_grpc_web_pb.d.ts generated/echo_grpc_web_pb.js \
      ${tscCompilerOptions} --outDir ./dist`;
    runTscCmd(tscCmd);

    // check for the tsc output
    assertFileExists('./tsc-tests/dist/client03.js');
    assertFileExists('./tsc-tests/dist/generated/echo_pb.js');

    const {echoService, EchoRequest} =
      require(relativePath('./tsc-tests/dist/client03.js'));
    assert.equal('function', typeof echoService.echo);
    assert.equal('function', typeof echoService.serverStreamingEcho);

    const req = new EchoRequest();
    req.setMessage('aaa');
    MockXMLHttpRequest.onSend = function(xhr) {
      // The interceptor will attach "[-out-]" in front of our proto message.
      // See the interceptor code in client03.ts.
      // So by the time the proto is being sent by the underlying transport, it
      // should contain the string "[-out-]aaa".
      assert.equal('AAAAAAwKClstb3V0LV1hYWE=', xhr.body);

      xhr.respond(200, {'Content-Type': 'application/grpc-web-text',
                        'p': 'q'}, // add a piece of initial metadata
                  // echo it back, plus a trailing metadata "x: y"
                  'AAAAAAwKClstb3V0LV1hYWGAAAAABng6IHkNCg==');
    };
    // this is the callback-based client
    var call = echoService.echo(req, {}, (err, response) => {
      assert.ifError(err);
      // Now, the interceptor will be invoked again on receiving the response
      // from the server. It attaches an additional "[-in-]" string in front of
      // the server response.
      assert.equal('[-in-][-out-]aaa', response.getMessage());
      done();
    });
    call.on('metadata', (initialMetadata) => {
      assert('p' in initialMetadata);
      assert(!('x' in initialMetadata));
      assert.equal('q', initialMetadata['p']);
      done();
    });
    call.on('status', (status) => {
      assert('metadata' in status);
      var trailingMetadata = status.metadata;
      assert('x' in trailingMetadata);
      assert(!('p' in trailingMetadata));
      assert.equal('y', trailingMetadata['x']);
      done();
    });
  });

});

describe('tsc test04: unaryInterceptor', function() {
  before(function() {
    cleanup();
    createGeneratedCodeDir();
    MockXMLHttpRequest = mockXmlHttpRequest.newMockXhr();
    global.XMLHttpRequest = MockXMLHttpRequest;
    const genCmd = `protoc -I=./test/protos echo.proto \
      --js_out=import_style=commonjs:${outputDir} \
      --grpc-web_out=import_style=commonjs+dts,mode=grpcwebtext:${outputDir}`;
    execSync(genCmd);
  });

  after(function() {
    cleanup();
  });

  it('generated code should exist', function() {
    assertFileExists('./tsc-tests/generated/echo_pb.js');
    assertFileExists('./tsc-tests/generated/echo_pb.d.ts');
    assertFileExists('./tsc-tests/generated/echo_grpc_web_pb.js');
    assertFileExists('./tsc-tests/generated/echo_grpc_web_pb.d.ts');
  });

  it('tsc should run and export', function(done) {
    const tscCmd = `tsc client04.ts \
      generated/echo_pb.d.ts generated/echo_pb.js \
      generated/echo_grpc_web_pb.d.ts generated/echo_grpc_web_pb.js \
      ${tscCompilerOptions} --outDir ./dist`;
    runTscCmd(tscCmd);

    // check for the tsc output
    assertFileExists('./tsc-tests/dist/client04.js');
    assertFileExists('./tsc-tests/dist/generated/echo_pb.js');

    const {echoService, EchoRequest} =
      require(relativePath('./tsc-tests/dist/client04.js'));
    assert.equal('function', typeof echoService.echo);
    assert.equal('function', typeof echoService.serverStreamingEcho);

    const req = new EchoRequest();
    req.setMessage('aaa');
    MockXMLHttpRequest.onSend = function(xhr) {
      // The interceptor will attach "[-out-]" in front of our proto message.
      // See the interceptor code in client04.ts.
      // So by the time the proto is being sent by the underlying transport, it
      // should contain the string "[-out-]aaa".
      assert.equal('AAAAAAwKClstb3V0LV1hYWE=', xhr.body);

      xhr.respond(200, {'Content-Type': 'application/grpc-web-text',
                        'p': 'q'}, // add a piece of initial metadata
                  // echo it back, plus a trailing metadata "x: y"
                  'AAAAAAwKClstb3V0LV1hYWGAAAAABng6IHkNCg==');
    };
    // this is the promise-based client
    echoService.echo(req, {}).then((response) => {
      // Now, the interceptor will be invoked again on receiving the response
      // from the server. See the initerceptor logic in client04.ts. It
      // flattens both the initialMetadata and the trailingMetadata, and then
      // attaches an additional "[-in-]" string in front of the server
      // response.
      assert.equal('<-InitialMetadata->p: q<-TrailingMetadata->x: y'+
                   '[-in-][-out-]aaa', response.getMessage());
      done();
    });
  });

});

describe('tsc test05: callback-based client', function() {
  before(function() {
    cleanup();
    createGeneratedCodeDir();
    MockXMLHttpRequest = mockXmlHttpRequest.newMockXhr();
    global.XMLHttpRequest = MockXMLHttpRequest;
    const genCmd = `protoc -I=./test/protos echo.proto \
      --js_out=import_style=commonjs:${outputDir} \
      --grpc-web_out=import_style=commonjs+dts,mode=grpcwebtext:${outputDir}`;
    execSync(genCmd);
  });

  after(function() {
    cleanup();
  });

  it('generated code should exist', function() {
    assertFileExists('./tsc-tests/generated/echo_pb.js');
    assertFileExists('./tsc-tests/generated/echo_pb.d.ts');
    assertFileExists('./tsc-tests/generated/echo_grpc_web_pb.js');
    assertFileExists('./tsc-tests/generated/echo_grpc_web_pb.d.ts');
  });

  it('tsc should run and export', function() {
    const tscCmd = `tsc client05.ts \
      generated/echo_pb.d.ts generated/echo_pb.js \
      generated/echo_grpc_web_pb.d.ts generated/echo_grpc_web_pb.js \
      ${tscCompilerOptions} --outDir ./dist`;
    // this test only makes sure the TS client code compiles successfully
    runTscCmd(tscCmd);

    // check for the tsc output
    assertFileExists('./tsc-tests/dist/client05.js');
    assertFileExists('./tsc-tests/dist/generated/echo_pb.js');
  });
});

describe('tsc test06: promise-based client', function() {
  before(function() {
    cleanup();
    createGeneratedCodeDir();
    MockXMLHttpRequest = mockXmlHttpRequest.newMockXhr();
    global.XMLHttpRequest = MockXMLHttpRequest;
    const genCmd = `protoc -I=./test/protos echo.proto \
      --js_out=import_style=commonjs:${outputDir} \
      --grpc-web_out=import_style=commonjs+dts,mode=grpcwebtext:${outputDir}`;
    execSync(genCmd);
  });

  after(function() {
    cleanup();
  });

  it('generated code should exist', function() {
    assertFileExists('./tsc-tests/generated/echo_pb.js');
    assertFileExists('./tsc-tests/generated/echo_pb.d.ts');
    assertFileExists('./tsc-tests/generated/echo_grpc_web_pb.js');
    assertFileExists('./tsc-tests/generated/echo_grpc_web_pb.d.ts');
  });

  it('tsc should run and export', function() {
    const tscCmd = `tsc client06.ts \
      generated/echo_pb.d.ts generated/echo_pb.js \
      generated/echo_grpc_web_pb.d.ts generated/echo_grpc_web_pb.js \
      ${tscCompilerOptions} --outDir ./dist`;
    // this test only makes sure the TS client code compiles successfully
    runTscCmd(tscCmd);

    // check for the tsc output
    assertFileExists('./tsc-tests/dist/client06.js');
    assertFileExists('./tsc-tests/dist/generated/echo_pb.js');
  });
});
