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

ARG EXAMPLE_DIR=/github/grpc-web/net/grpc/gateway/examples/echo
ARG ANGULAR_SERVICE_DIR=$EXAMPLE_DIR/angular-example/src/app/shared

RUN npm install -g @angular/cli

RUN curl -o chrome.deb -sSL https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
RUN dpkg -i chrome.deb; apt-get -fy install

RUN protoc -I=$EXAMPLE_DIR echo.proto \
--js_out=import_style=commonjs:$ANGULAR_SERVICE_DIR \
--grpc-web_out=import_style=commonjs+dts,mode=grpcwebtext,framework=angular:$ANGULAR_SERVICE_DIR

RUN cd $EXAMPLE_DIR/angular-example && \
  npm install && \
  ng build --prod && \
  cp dist/angular-example/* /var/www/html

EXPOSE 8081
WORKDIR /var/www/html
CMD ["python", "-m", "SimpleHTTPServer", "8081"]
