#!/bin/bash
# Copyright 2018 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

cd "$(dirname "$0")"
pwd=$(pwd)

# This environment variable is being set by the Dockerfile
if [[ "$with_examples" = false ]]; then
  exit 0;
fi

# Install Protobuf
cd "$pwd"/../third_party/grpc/third_party/protobuf && \
  ./autogen.sh && ./configure && make && make install && ldconfig

# Download closure-compiler.jar and build the example
cd "$pwd"/../ && \
  curl http://dl.google.com/closure-compiler/compiler-latest.zip \
  -o compiler-latest.zip && \
  rm -f closure-compiler.jar && \
  unzip -p -qq -o compiler-latest.zip *.jar > closure-compiler.jar && \
  make example && \
  make install-example
