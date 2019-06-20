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

FROM grpcweb/common

ARG EXAMPLE_DIR=/github/grpc-web/net/grpc/gateway/examples/echo

COPY net/grpc/gateway/examples/echo/commonjs-example/ $EXAMPLE_DIR/commonjs-example/

RUN protoc -I=$EXAMPLE_DIR echo.proto \
--js_out=import_style=commonjs:\
$EXAMPLE_DIR/commonjs-example \
--grpc-web_out=import_style=commonjs,mode=grpcwebtext:\
$EXAMPLE_DIR/commonjs-example

RUN cd $EXAMPLE_DIR/commonjs-example && \
  npm install && \
  npx webpack && \
  cp echotest.html /var/www/html && \
  cp dist/main.js /var/www/html/dist

EXPOSE 8081
WORKDIR /var/www/html
CMD ["python", "-m", "SimpleHTTPServer", "8081"]
