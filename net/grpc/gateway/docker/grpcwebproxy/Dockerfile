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

FROM golang:alpine

RUN apk add --no-cache curl git ca-certificates && \
  rm -rf /var/lib/apt/lists/*

ARG VERSION=0.12.0

WORKDIR /tmp

RUN curl -sS https://raw.githubusercontent.com/golang/dep/master/install.sh | sh
RUN wget https://github.com/improbable-eng/grpc-web/archive/v$VERSION.tar.gz

WORKDIR /go/src/github.com/improbable-eng/

RUN tar -zxf /tmp/v$VERSION.tar.gz -C .
RUN mv grpc-web-$VERSION grpc-web

WORKDIR /go/src/github.com/improbable-eng/grpc-web

RUN dep ensure && \
  go install ./go/grpcwebproxy

ADD ./etc/localhost.crt /etc
ADD ./etc/localhost.key /etc

ENTRYPOINT [ "/bin/sh", "-c", "exec /go/bin/grpcwebproxy \
  --backend_addr=node-server:9090 \
  --run_tls_server=false \
  --allow_all_origins " ]
