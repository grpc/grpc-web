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
const outputDir = './test/tsc-tests/generated';

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
    execSync(`tsc client01.ts generated/test01_pb.d.ts generated/test01_pb.js \
      --allowJs --outDir ./dist`, {
        cwd: relativePath('./tsc-tests')
    });

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
    execSync(`tsc client02.ts generated/Test02ServiceClientPb.ts \
      generated/test02_pb.d.ts generated/test02_pb.js \
      generated/test03_pb.d.ts generated/test03_pb.js \
      --allowJs --outDir ./dist`, {
        cwd: relativePath('./tsc-tests')
    });

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
