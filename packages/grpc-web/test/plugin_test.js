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


describe('grpc-web plugin test, with subdirectories', function() {
  const oldXMLHttpRequest = global.XMLHttpRequest;

  const genCodePath1 = path.resolve(
    __dirname, GENERATED_CODE_PATH + '/myapi/v1/myapi_pb.js');
  const genCodePath2 = path.resolve(
    __dirname, GENERATED_CODE_PATH + '/otherapi/v1/otherapi_pb.js');
  const genCodePath3 = path.resolve(
    __dirname, GENERATED_CODE_PATH + '/myapi/v1/myapi_grpc_web_pb.js');

  const genCodeCmd =
    'protoc -I=./test/protos ' +
    './test/protos/myapi/v1/myapi.proto ' +
    './test/protos/otherapi/v1/otherapi.proto ' +
    '--js_out=import_style=commonjs:./test/generated ' +
    '--grpc-web_out=import_style=commonjs,mode=grpcwebtext:./test/generated';

  before(function() {
    ['protoc', 'protoc-gen-grpc-web'].map(prog => {
      if (!commandExists(prog)) {
        assert.fail(`${prog} is not installed`);
      }
    });
  });

  beforeEach(function() {
    removeDirectory(path.resolve(__dirname, GENERATED_CODE_PATH));
    fs.mkdirSync(path.resolve(__dirname, GENERATED_CODE_PATH));
    MockXMLHttpRequest = mockXmlHttpRequest.newMockXhr();
    global.XMLHttpRequest = MockXMLHttpRequest;
  });

  afterEach(function() {
    removeDirectory(path.resolve(__dirname, GENERATED_CODE_PATH));
    global.XMLHttpRequest = oldXMLHttpRequest;
  });

  it('should exist', function() {
    execSync(genCodeCmd);
    assert.equal(true, fs.existsSync(genCodePath1));
    assert.equal(true, fs.existsSync(genCodePath2));
    assert.equal(true, fs.existsSync(genCodePath3));
  });

  it('should import', function() {
    execSync(genCodeCmd);

    const {OtherThing} = require(genCodePath2);
    var otherThing = new OtherThing();
    otherThing.setValue('abc');
    assert.equal('abc', otherThing.getValue());

    const {MyServiceClient} = require(genCodePath3);
    var myClient = new MyServiceClient("MyHostname", null, null);
    assert.equal('function', typeof myClient.doThis);
  });

  it('should send unary request', function(done) {
    execSync(genCodeCmd);

    const {OtherThing} = require(genCodePath2);
    var otherThing = new OtherThing();
    otherThing.setValue('abc');

    const {MyServiceClient} = require(genCodePath3);
    var myClient = new MyServiceClient("MyHostname", null, null);

    MockXMLHttpRequest.onSend = function(xhr) {
      assert.equal("AAAAAAUKA2FiYw==", xhr.body);
      assert.equal("MyHostname/myproject.myapi.v1.MyService/DoThis", xhr.url);
      done();
    };
    myClient.doThis(otherThing);
  });
});


describe('grpc-web plugin test, with multiple input files', function() {
  const genCodePath1 = path.resolve(
    __dirname, GENERATED_CODE_PATH + '/myapi/v1/myapi_pb.js');
  const genCodePath2 = path.resolve(
    __dirname, GENERATED_CODE_PATH + '/otherapi/v1/otherapi_pb.js');
  const genCodePath3 = path.resolve(
    __dirname, GENERATED_CODE_PATH + '/myapi/v1/myapi_grpc_web_pb.js');
  const genCodePath4 = path.resolve(
    __dirname, GENERATED_CODE_PATH + '/myapi/v1/myapi-two_grpc_web_pb.js');

  const genCodeCmd =
    'protoc -I=./test/protos ' +
    './test/protos/myapi/v1/myapi.proto ' +
    './test/protos/myapi/v1/myapi-two.proto ' +
    './test/protos/otherapi/v1/otherapi.proto ' +
    '--js_out=import_style=commonjs:./test/generated ' +
    '--grpc-web_out=import_style=commonjs,mode=grpcwebtext:./test/generated';

  before(function() {
    ['protoc', 'protoc-gen-grpc-web'].map(prog => {
      if (!commandExists(prog)) {
        assert.fail(`${prog} is not installed`);
      }
    });
  });

  beforeEach(function() {
    removeDirectory(path.resolve(__dirname, GENERATED_CODE_PATH));
    fs.mkdirSync(path.resolve(__dirname, GENERATED_CODE_PATH));
  });

  afterEach(function() {
    removeDirectory(path.resolve(__dirname, GENERATED_CODE_PATH));
  });

  it('should exist', function() {
    execSync(genCodeCmd);
    assert.equal(true, fs.existsSync(genCodePath1));
    assert.equal(true, fs.existsSync(genCodePath2));
    assert.equal(true, fs.existsSync(genCodePath3));
    assert.equal(true, fs.existsSync(genCodePath4));
  });

  it('should import', function() {
    execSync(genCodeCmd);

    const {OtherThing} = require(genCodePath2);
    var otherThing = new OtherThing();
    otherThing.setValue('abc');
    assert.equal('abc', otherThing.getValue());

    const {MyServiceClient} = require(genCodePath3);
    var myClient = new MyServiceClient("MyHostname", null, null);
    assert.equal('function', typeof myClient.doThis);

    const {MyServiceBClient} = require(genCodePath4);
    var myClientB = new MyServiceBClient("MyHostname", null, null);
    assert.equal('function', typeof myClientB.doThat);
  });
});


describe('grpc-web plugin test, proto with no package', function() {
  const genCodePath1 = path.resolve(
    __dirname, GENERATED_CODE_PATH + '/nopackage_pb.js');
  const genCodePath2 = path.resolve(
    __dirname, GENERATED_CODE_PATH + '/nopackage_grpc_web_pb.js');

  const genCodeCmd =
    'protoc -I=./test/protos ' +
    './test/protos/nopackage.proto ' +
    '--js_out=import_style=commonjs:./test/generated ' +
    '--grpc-web_out=import_style=commonjs,mode=grpcwebtext:./test/generated';

  before(function() {
    ['protoc', 'protoc-gen-grpc-web'].map(prog => {
      if (!commandExists(prog)) {
        assert.fail(`${prog} is not installed`);
      }
    });

    removeDirectory(path.resolve(__dirname, GENERATED_CODE_PATH));
    fs.mkdirSync(path.resolve(__dirname, GENERATED_CODE_PATH));
    MockXMLHttpRequest = mockXmlHttpRequest.newMockXhr();
    global.XMLHttpRequest = MockXMLHttpRequest;

    execSync(genCodeCmd);
    assert.equal(true, fs.existsSync(genCodePath1));
    assert.equal(true, fs.existsSync(genCodePath2));
  });

  after(function() {
    removeDirectory(path.resolve(__dirname, GENERATED_CODE_PATH));
  });

  it('should import', function() {
    const {HelloRequest} = require(genCodePath1);
    var request = new HelloRequest();

    request.setName('abc');
    assert.equal('abc', request.getName());
  });

  it('callback-based generated client: should exist', function() {
    const {GreeterClient} = require(genCodePath2);
    var myClient = new GreeterClient("MyHostname", null, null);

    assert.equal('function', typeof myClient.sayHello);
  });

  it('promise-based generated client: should exist', function() {
    const {HelloRequest} = require(genCodePath1);
    const {GreeterPromiseClient} = require(genCodePath2);
    var myClient = new GreeterPromiseClient("MyHostname", null, null);

    assert.equal('function', typeof myClient.sayHello);

    var p = myClient.sayHello(new HelloRequest(), {});
    assert.equal('function', typeof p.then);
  });
});
