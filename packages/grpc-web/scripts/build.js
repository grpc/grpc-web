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

const path = require("path");
const {exec} = require("child_process");

const cwd = process.cwd();

const indexPath = path.relative(cwd, path.resolve(__dirname, "../index.js"));

const jsPaths = [
  "../../../javascript",
  "../../../third_party/closure-library",
  "../../../third_party/grpc/third_party/protobuf/js",
].map(jsPath => path.relative(cwd, path.resolve(__dirname, jsPath)));

const grpcWebExports = [
  "grpc.web.AbstractClientBase",
  "grpc.web.ClientReadableStream",
  "grpc.web.Error",
  "grpc.web.GrpcWebClientBase",
  "grpc.web.GrpcWebClientReadableStream",
  "grpc.web.GrpcWebStreamParser",
  "grpc.web.Status",
  "grpc.web.StatusCode",
];

const closureArgs = [].concat(
  jsPaths.map(jsPath => `--js=${jsPath}`),
  grpcWebExports.map(grpcWebExport => `--entry_point=${grpcWebExport}`),
  [
    `--dependency_mode=STRICT`,
    `--js_output_file=${indexPath}`,
    `--output_wrapper="%output%module.exports=grpc.web;"`,
  ]
);

const closureCommand = "google-closure-compiler " + closureArgs.join(' ');

console.log(closureCommand);
let child = exec(closureCommand);

child.stdout.pipe(process.stdout);
child.stderr.pipe(process.stderr);
