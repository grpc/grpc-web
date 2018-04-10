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

cd "$(dirname "$0")"
./init_submodules.sh
cd ..
make clean
cd third_party/grpc/third_party/protobuf \
  && ./autogen.sh \
  && ./configure \
  && make install -j8 \
  && cd ../../../..
if [[ $(uname -r) == 16* ]]; # Mac OS X Sierra
then
  cd third_party/grpc \
    && CPPFLAGS=-DOSATOMIC_USE_INLINED=1 make install \
    && cd ../..
else
  cd third_party/grpc \
    && make install -j8 \
    && cd ../..
fi
export KERNEL_BITS=64
make
