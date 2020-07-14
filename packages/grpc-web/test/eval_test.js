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

describe('grpc-web generated code eval test (commonjs+dts)', function() {
  const genCodeCmd =
    'protoc -I=./test/protos foo.proto models.proto ' +
    '--js_out=import_style=commonjs:./test/generated ' +
    '--grpc-web_out=import_style=commonjs+dts,mode=grpcwebtext:' +
    './test/generated';

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

  it('should eval', function() {
    execSync(genCodeCmd);
    execSync(`npx gulp --gulpfile ./test/gulpfile.js gen-code-eval-test`);
  })
});


describe('grpc-web generated code eval test (typescript)', function() {
  const genTsCodePath = path.resolve(__dirname,
                                     './generated/FooServiceClientPb.ts');

  const genCodeCmd =
    'protoc -I=./test/protos foo.proto models.proto ' +
    '--js_out=import_style=commonjs:./test/generated ' +
    '--grpc-web_out=import_style=typescript,mode=grpcwebtext:./test/generated';

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

  it('should eval', function() {
    execSync(genCodeCmd);
    execSync(`tsc --strict ${genTsCodePath}`);
  });
});
