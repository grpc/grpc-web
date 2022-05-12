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
# node:... Docker image is based on buildpack-deps:stretch
FROM buildpack-deps:bullseye AS prepare

ARG BUILDIFIER_VERSION=5.1.0
ARG PROTOBUF_VERSION=3.19.4
ARG TARGETARCH

RUN apt-get -qq update && apt-get -qq install -y curl unzip

WORKDIR /tmp

RUN case $TARGETARCH in arm64) arch="aarch_64"; ;; amd64) arch="x86_64"; ;; *) echo "ERROR: Machine type $TARGETARCH not supported."; ;; esac && \
curl -sSL https://github.com/protocolbuffers/protobuf/releases/download/v$PROTOBUF_VERSION/\
protoc-$PROTOBUF_VERSION-linux-$arch.zip -o protoc.zip && \
  unzip -qq protoc.zip && \
  cp ./bin/protoc /usr/local/bin/protoc

RUN wget -nv -O buildifier \
  https://github.com/bazelbuild/buildtools/releases/download/$BUILDIFIER_VERSION/buildifier-linux-$TARGETARCH && \
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
FROM node:16-bullseye AS copy-and-build

ARG MAKEFLAGS=-j8
ARG BAZELISK_VERSION=1.11.0
ARG TARGETARCH

RUN mkdir -p /var/www/html/dist
RUN echo "\nloglevel=error\n" >> $HOME/.npmrc

COPY --from=prepare /usr/local/bin/protoc /usr/local/bin/
COPY --from=prepare /usr/local/bin/buildifier /usr/local/bin/
COPY --from=prepare /github/grpc-web/third_party /github/grpc-web/third_party

RUN wget -nv -O /usr/local/bin/bazelisk \
  https://github.com/bazelbuild/bazelisk/releases/download/v$BAZELISK_VERSION/bazelisk-linux-$TARGETARCH && \
  chmod +x /usr/local/bin/bazelisk && \
  bazelisk

WORKDIR /github/grpc-web

# Copy only files necessary to build the protoc-gen-grpc-web first as an optimization because they
# are rarely updated compared with the javascript files.
COPY ./WORKSPACE ./WORKSPACE
COPY ./javascript/net/grpc/web/generator javascript/net/grpc/web/generator

RUN bazelisk build --jobs=2 javascript/net/grpc/web/generator:protoc-gen-grpc-web && \
  cp $(bazelisk info bazel-genfiles)/javascript/net/grpc/web/generator/protoc-gen-grpc-web \
  /usr/local/bin/protoc-gen-grpc-web

COPY ./javascript ./javascript
COPY ./packages ./packages

RUN cd ./packages/grpc-web && \
  npm install && \
  npm run build && \
  npm link

COPY ./Makefile ./Makefile
COPY ./net ./net
COPY ./scripts ./scripts
COPY ./src ./src
COPY ./test ./test

RUN /usr/local/bin/buildifier \
  --mode=check --lint=warn --warnings=all -r ./WORKSPACE javascript net
