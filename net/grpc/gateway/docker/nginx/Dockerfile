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

RUN apt-get -qq install -y \
  zip

RUN cd /github/grpc-web/net/grpc/gateway/examples/echo && \
  sed -i 's/localhost:9090/echo-server:9090/g' nginx.conf

RUN cd /github/grpc-web && \
  make standalone-proxy

EXPOSE 8080
CMD ["/github/grpc-web/gConnector_static/nginx.sh"]
