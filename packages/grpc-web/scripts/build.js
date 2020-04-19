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
  "../exports.js",
  "../../../javascript",
  "../../../third_party/closure-library",
].map(jsPath => path.relative(cwd, path.resolve(__dirname, jsPath)));

const closureArgs = [].concat(
  jsPaths.map(jsPath => `--js=${jsPath}`),
  [
    `--entry_point=grpc.web.Exports`,
    `--externs=externs.js`,
    `--dependency_mode=PRUNE`,
    `--compilation_level=ADVANCED_OPTIMIZATIONS`,
    `--generate_exports`,
    `--export_local_property_definitions`,
    `--js_output_file=${indexPath}`,
  ]
);

const closureCompilerBin = path.resolve(__dirname, "../node_modules/.bin/google-closure-compiler");
const closureCommand = closureCompilerBin + " " + closureArgs.join(' ');

console.log(closureCommand);
let child = exec(closureCommand);

child.stdout.pipe(process.stdout);
child.stderr.pipe(process.stderr);
