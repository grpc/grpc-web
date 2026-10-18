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


# Using multi-stage buid (See: https://docs.docker.com/develop/develop-images/multistage-build/)

######################################
# Stage 1: Fetch binaries
######################################
# node:... Docker image is based on buildpack-deps:trixie (13)
FROM buildpack-deps:trixie AS prepare

ARG BUILDIFIER_VERSION=8.5.1
ARG PROTOBUF_VERSION=36.1
ARG PROTOBUF_JS_VERSION=3.21.4

RUN apt-get -qq update && apt-get -qq install -y curl unzip

WORKDIR /tmp

RUN curl -sSL https://github.com/protocolbuffers/protobuf/releases/download/v$PROTOBUF_VERSION/\
protoc-$PROTOBUF_VERSION-linux-x86_64.zip -o protoc.zip && \
  unzip -qq protoc.zip && \
  cp ./bin/protoc /usr/local/bin/protoc

RUN curl -sSL https://github.com/protocolbuffers/protobuf-javascript/releases/download/\
v$PROTOBUF_JS_VERSION/protobuf-javascript-$PROTOBUF_JS_VERSION-linux-x86_64.tar.gz -o protobuf-js.tar.gz && \
  mkdir -p ./protobuf-js && \
  tar -xzf protobuf-js.tar.gz -C ./protobuf-js && \
  cp ./protobuf-js/bin/protoc-gen-js /usr/local/bin/protoc-gen-js

RUN wget -nv -O buildifier \
  https://github.com/bazelbuild/buildtools/releases/download/v$BUILDIFIER_VERSION/buildifier-linux-amd64 && \
  chmod +x ./buildifier && \
  cp ./buildifier /usr/local/bin/buildifier

# Download third_party modules to be used for the next stage
WORKDIR /github/grpc-web

RUN git clone https://github.com/grpc/grpc-web .
COPY ./scripts/init_submodules.sh ./scripts/
RUN ./scripts/init_submodules.sh

######################################
# Stage 2: Copy source files and build
######################################
FROM node:24-trixie AS copy-and-build

ARG MAKEFLAGS=-j8
ARG BAZEL_VERSION=7.3.0

RUN apt-get -qq update && apt-get -qq install -y python3 python-is-python3

RUN mkdir -p /var/www/html/dist
RUN echo "\nloglevel=error\n" >> $HOME/.npmrc

COPY --from=prepare /usr/local/bin/protoc /usr/local/bin/
COPY --from=prepare /usr/local/bin/protoc-gen-js /usr/local/bin/
COPY --from=prepare /usr/local/bin/buildifier /usr/local/bin/
COPY --from=prepare /github/grpc-web/third_party /github/grpc-web/third_party

RUN wget -nv -O bazel-installer.sh \
  https://github.com/bazelbuild/bazel/releases/download/$BAZEL_VERSION/\
bazel-$BAZEL_VERSION-installer-linux-x86_64.sh && \
  chmod +x ./bazel-installer.sh && \
  ./bazel-installer.sh && \
  rm ./bazel-installer.sh

WORKDIR /github/grpc-web

# Copy only files necessary to build the protoc-gen-grpc-web first as an optimization because they
# are rarely updated compared with the javascript files.
COPY ./MODULE.bazel ./MODULE.bazel
COPY ./MODULE.bazel.lock ./MODULE.bazel.lock
COPY ./.bazelrc ./.bazelrc
COPY ./javascript/net/grpc/web/generator javascript/net/grpc/web/generator

# Pre-build the protobuf compiler lib so the following plugin build can reuse Bazel cache.
RUN bazel build "@com_google_protobuf//:protoc_lib"

RUN bazel build javascript/net/grpc/web/generator:protoc-gen-grpc-web && \
  cp $(bazel info bazel-genfiles)/javascript/net/grpc/web/generator/protoc-gen-grpc-web \
  /usr/local/bin/protoc-gen-grpc-web

COPY ./javascript ./javascript
COPY ./packages ./packages
COPY ./src ./src

RUN mkdir -p ./src/typescript/generated && \
    protoc -I=./src/typescript/proto -I=/usr/local/include \
    ./src/typescript/proto/status.proto \
    --js_out=import_style=commonjs:./src/typescript/generated \
    --grpc-web_out=import_style=commonjs+dts,mode=grpcwebtext:./src/typescript/generated

RUN cd ./packages/closure-wrapper && \
  yarn install && \
  yarn build && \
  cd ../grpc-web && \
  npm install --ignore-scripts && \
  npm run build && \
  npm link

COPY ./Makefile ./Makefile
COPY ./net ./net
COPY ./scripts ./scripts
COPY ./src ./src
COPY ./test ./test

RUN /usr/local/bin/buildifier \
  --mode=check --lint=warn --warnings=all -r ./MODULE.bazel javascript net
