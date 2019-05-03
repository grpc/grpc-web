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

RUN apt-get -qq update && apt-get -qq install -y \
  default-jdk

RUN cd /github/grpc-web && \
  curl -sS https://dl.google.com/closure-compiler/compiler-latest.zip \
  -o /github/grpc-web/compiler-latest.zip

RUN cd /github/grpc-web && \
  rm -f /github/grpc-web/closure-compiler.jar && \
  unzip -p -qq -o /github/grpc-web/compiler-latest.zip *.jar > \
  /github/grpc-web/closure-compiler.jar

RUN cd /github/grpc-web && \
  make client && make install-example

EXPOSE 8081
WORKDIR /var/www/html
CMD ["python", "-m", "SimpleHTTPServer", "8081"]
