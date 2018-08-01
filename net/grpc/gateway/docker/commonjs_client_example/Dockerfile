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

FROM grpc-web:prereqs

RUN cp /github/grpc-web/net/grpc/gateway/examples/echo/nginx_simple.conf \
  /etc/nginx/nginx.conf

RUN curl -sL https://deb.nodesource.com/setup_8.x | bash - && \
  apt-get install -y nodejs

RUN cd /github/grpc-web/javascript/net/grpc/web && \
  make

RUN cd /github/grpc-web/packages/grpc-web && \
  rm -rf node_modules && \
  npm install && \
  npm run build && \
  npm link

RUN protoc -I=/github/grpc-web/net/grpc/gateway/examples/echo echo.proto \
  --plugin=protoc-gen-grpc-web=/github/grpc-web/javascript/net/grpc/web/protoc-gen-grpc-web \
  --js_out=import_style=commonjs:/github/grpc-web/net/grpc/gateway/examples/echo/commonjs-example \
  --grpc-web_out=import_style=commonjs,mode=grpcweb,out=echo_grpc_pb.js:/github/grpc-web/net/grpc/gateway/examples/echo/commonjs-example

RUN cd /github/grpc-web/net/grpc/gateway/examples/echo/commonjs-example && \
  rm -rf node_modules && \
  npm install && \
  npm link grpc-web && \
  ./node_modules/.bin/browserify client.js > out.js

EXPOSE 8081
CMD ["nginx"]
