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
# node:... Docker image is based on buildpack-deps:bullseye (11)
FROM buildpack-deps:bullseye AS prepare

ARG BUILDIFIER_VERSION=1.0.0
ARG PROTOBUF_VERSION=3.19.4

RUN apt-get -qq update && apt-get -qq install -y curl unzip

WORKDIR /tmp

RUN curl -sSL https://github.com/protocolbuffers/protobuf/releases/download/v$PROTOBUF_VERSION/\
protoc-$PROTOBUF_VERSION-linux-x86_64.zip -o protoc.zip && \
  unzip -qq protoc.zip && \
  cp ./bin/protoc /usr/local/bin/protoc

RUN wget -nv -O buildifier \
  https://github.com/bazelbuild/buildtools/releases/download/$BUILDIFIER_VERSION/buildifier && \
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
FROM node:20.0.0-bullseye AS copy-and-build

ARG MAKEFLAGS=-j8
ARG BAZEL_VERSION=4.1.0

RUN apt-get -qq update && apt-get -qq install -y python

RUN mkdir -p /var/www/html/dist
RUN echo "\nloglevel=error\n" >> $HOME/.npmrc

COPY --from=prepare /usr/local/bin/protoc /usr/local/bin/
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
COPY ./WORKSPACE ./WORKSPACE
COPY ./javascript/net/grpc/web/generator javascript/net/grpc/web/generator

RUN bazel build javascript/net/grpc/web/generator:protoc-gen-grpc-web && \
  cp $(bazel info bazel-genfiles)/javascript/net/grpc/web/generator/protoc-gen-grpc-web \
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
