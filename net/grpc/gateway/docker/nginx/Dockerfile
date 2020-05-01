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

FROM grpcweb/grpc-base

RUN apt-get -qq install -y \
  cmake zip

WORKDIR /github/grpc-web

RUN cd third_party/grpc/third_party && \
  ln -s ./abseil-cpp/absl absl

RUN cd third_party/grpc/third_party/abseil-cpp && \
  git remote update && \
  git checkout df3ea78 -b 20200225.1 && \
  cmake . && \
  make && \
  make install

RUN cd ./net/grpc/gateway/examples/echo && \
  sed -i 's/localhost:9090/echo-server:9090/g' nginx.conf

RUN make standalone-proxy

EXPOSE 8080
CMD ["./gConnector_static/nginx.sh"]
