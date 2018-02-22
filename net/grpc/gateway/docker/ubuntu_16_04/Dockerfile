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

# BUILD
#
# Option 1: Only the Nginx gateway
#
# $ docker build \
#   -t grpc-web \
#   -f ~/grpc-web/net/grpc/gateway/docker/ubuntu_16_04/Dockerfile .
#
# Option 2: With end-to-end example
#
# $ docker build \
#   -t grpc-web \
#   --build-arg build_examples=true \
#   -f ~/grpc-web/net/grpc/gateway/docker/ubuntu_16_04/Dockerfile .
#
# RUN
#
# 1. Nginx gateway:
#
# $ docker run -itp 8080:8080 -p 9091:9091 --name grpc-web grpc-web /bin/bash
# $ cd /github/grpc-web/gConnector && ./nginx.sh
#
# 2. Backend gRPC server:
# (if you had built the end-to-end example with Option 2 in the BUILD section)
#
# $ docker exec -it grpc-web \
#   /github/grpc-web/net/grpc/gateway/examples/echo/echo_server
#
# 3. Browser example:
# (if you had built the end-to-end example with Option 2 in the BUILD section)
#
# Once the Nginx gateway and the Echo server are both running in different
# terminals, you can point a web browser to
#
# http://localhost:8080/net/grpc/gateway/examples/echo/echotest.html

FROM ubuntu:16.04

ARG build_examples=false
ENV build_examples $build_examples
ENV EMBED_OPENSSL false

RUN apt-get update && apt-get install -y \
  autoconf \
  automake \
  build-essential \
  curl \
  git \
  default-jdk \
  default-jre \
  libtool \
  libpcre3 \
  libpcre3-dev \
  libssl-dev \
  make \
  python-software-properties \
  software-properties-common \
  zip

COPY . /github/grpc-web

RUN cd /github/grpc-web && \
  ./scripts/init_submodules.sh

RUN cd /github/grpc-web/third_party/grpc && \
  make && make install && ldconfig

RUN cd /github/grpc-web && \
  make

RUN cd /github/grpc-web/ && \
  ./scripts/build_examples.sh

