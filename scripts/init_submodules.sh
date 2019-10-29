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
set -ex

cd "$(dirname "$0")"/..
git submodule update --init
cd third_party/closure-library && git checkout tags/v20171112 -f && cd ../..
cd third_party/openssl && git checkout tags/OpenSSL_1_0_2h -f && cd ../..
cd third_party/grpc && git checkout 2de2e8d -f && git submodule update --init && cd ../..
