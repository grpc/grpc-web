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

describe('grpc-web generated code eval test (commonjs+dts)', function() {
  const genCodePath = path.resolve(__dirname, './foo_grpc_web_pb.js');

  const genCodeCmd =
    'protoc -I=./test/protos foo.proto models.proto ' +
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
    [genCodePath].map(f => {
       if (fs.existsSync(f)) {
         fs.unlinkSync(f);
       }
     });
  });

  afterEach(function() {
    [genCodePath].map(f => {
       if (fs.existsSync(f)) {
         fs.unlinkSync(f);
       }
     });
  });

  it('should eval', function() {
    execSync(genCodeCmd);
    execSync(`npx gulp --gulpfile ./test/gulpfile.js`);
  })
});
