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

FROM node:alpine as node-server
WORKDIR /echo/nodeServer

COPY net/grpc/gateway/examples/echo/echo.proto ..
COPY net/grpc/gateway/examples/echo/node-server .

RUN npm ci

EXPOSE 9090
CMD ["node", "server.js"]


FROM envoyproxy/envoy:latest as envoy

COPY net/grpc/gateway/examples/echo/envoy.yaml /etc/envoy/envoy.yaml

CMD ["envoy", "-c /etc/envoy/envoy.yaml", "-l trace", "--log-path /tmp/envoy_info.log"]


FROM node:alpine as js-client-builder
WORKDIR /echo/commonjs-example/

COPY net/grpc/gateway/examples/echo/echo.proto net/grpc/gateway/examples/echo/echoapp.js ../
COPY net/grpc/gateway/examples/echo/commonjs-example .

RUN apk add protoc curl \
  && curl -sSL https://github.com/grpc/grpc-web/releases/download/1.0.7/protoc-gen-grpc-web-1.0.7-linux-x86_64 -o /usr/local/bin/protoc-gen-grpc-web \
  && chmod +x /usr/local/bin/protoc-gen-grpc-web \
  && protoc \
      --js_out=import_style=commonjs:. \
      --grpc-web_out=import_style=commonjs,mode=grpcwebtext:. \
      --proto_path=.. \
    echo.proto \
  && npm ci \
  && npx webpack

FROM nginx:alpine as commonjs-client

COPY --from=js-client-builder /echo/commonjs-example/echotest.html ./usr/share/nginx/html/index.html
COPY --from=js-client-builder /echo/commonjs-example/dist/. ./usr/share/nginx/html/dist/
