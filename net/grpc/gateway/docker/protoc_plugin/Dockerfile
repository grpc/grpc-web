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

FROM grpcweb/prereqs

ARG MAKEFLAGS=-j8

RUN apt-get -qq update && apt-get -qq install -y \
  cmake ninja-build \
  pkg-config \
  zlib1g-dev && \
  rm -rf /var/lib/apt/lists/*

WORKDIR /github/grpc-web

# Copy full source (including third_party)
COPY . /github/grpc-web

RUN rm -rf /usr/local/include/absl /usr/local/lib/libabsl*

WORKDIR /github/grpc-web/third_party/abseil-cpp
RUN cmake -S . -B cmake/build \
      -DCMAKE_POSITION_INDEPENDENT_CODE=ON \
      -DCMAKE_BUILD_TYPE=Release && \
    cmake --build cmake/build --target install

WORKDIR /github/grpc-web/third_party/protobuf
RUN cmake -S . -B cmake/build \
      -DCMAKE_BUILD_TYPE=Release \
      -Dprotobuf_BUILD_TESTS=OFF \
      -DCMAKE_POSITION_INDEPENDENT_CODE=ON \
      -DCMAKE_CXX_STANDARD=17 && \
    cmake --build cmake/build --target install
