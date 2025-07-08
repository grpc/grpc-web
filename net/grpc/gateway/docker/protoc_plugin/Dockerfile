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
ARG PROTOBUF_VERSION=v27.1

# Install required build tools and libraries
RUN apt-get update && apt-get install -y \
    cmake ninja-build \
    pkg-config zlib1g-dev \
    libtool autoconf automake \
    curl unzip git build-essential && \
    rm -rf /var/lib/apt/lists/*

# Set working directory for build context
WORKDIR /github/grpc-web

# Copy full grpc-web source including third_party
COPY . /github/grpc-web

# Clean existing Abseil install (if rebuilding)
RUN rm -rf /usr/local/include/absl /usr/local/lib/libabsl*

# Build Abseil
WORKDIR /github/grpc-web/third_party/abseil-cpp
RUN cmake -S . -B cmake/build \
    -DCMAKE_POSITION_INDEPENDENT_CODE=ON \
    -DCMAKE_CXX_STANDARD=17 \
    -DCMAKE_BUILD_TYPE=Release && \
    cmake --build cmake/build --target install

# Clone full Protobuf source manually (not shallow)
WORKDIR /github/grpc-web/third_party
RUN rm -rf protobuf && \
    git clone https://github.com/protocolbuffers/protobuf.git && \
    cd protobuf && \
    git checkout ${PROTOBUF_VERSION} && \
    git submodule update --init --recursive

# Build and install Protobuf using CMake
WORKDIR /github/grpc-web/third_party/protobuf
RUN cmake -S . -B build \
    -DCMAKE_BUILD_TYPE=Release \
    -Dprotobuf_BUILD_TESTS=OFF \
    -DCMAKE_POSITION_INDEPENDENT_CODE=ON \
    -DCMAKE_CXX_STANDARD=17 && \
    cmake --build build --target install

# Optional: Debug CMake errors (if build fails)
# RUN cat build/CMakeFiles/CMakeError.log || true
