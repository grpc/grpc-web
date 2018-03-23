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
#   -f net/grpc/gateway/docker/ubuntu_14_04/Dockerfile .
#
# Option 2: With end-to-end example
#
# $ docker build \
#   -t grpc-web \
#   --build-arg with_examples=true \
#   -f net/grpc/gateway/docker/ubuntu_14_04/Dockerfile .
#
# RUN
#
# 1. Run the docker container
#
# $ docker run -t -p 8080:8080 grpc-web
#
# 2. Browser example:
# (if you had built the end-to-end example with Option 2 in the BUILD section)
#
# Point a web browser to
#
# http://localhost:8080/net/grpc/gateway/examples/echo/echotest.html

FROM ubuntu:14.04

ARG with_examples=false
ARG MAKEFLAGS=-j8
ENV with_examples $with_examples
ENV EMBED_OPENSSL false

RUN apt-get update && apt-get install -y \
  autoconf \
  automake \
  build-essential \
  curl \
  git \
  libtool \
  libpcre3-dev \
  libssl-dev \
  make \
  software-properties-common \
  zip

RUN add-apt-repository ppa:openjdk-r/ppa && \
  apt-get update && apt-get install -y \
  openjdk-8-jdk \
  openjdk-8-jre

RUN git clone https://github.com/grpc/grpc-web /github/grpc-web

RUN cd /github/grpc-web && \
  ./scripts/init_submodules.sh

RUN cd /github/grpc-web/third_party/grpc && \
  make && make install

RUN cd /github/grpc-web && \
  make package

RUN cd /github/grpc-web && \
  ./scripts/build_examples.sh

EXPOSE 8080
CMD ["/github/grpc-web/gConnector/run_example.sh"]
