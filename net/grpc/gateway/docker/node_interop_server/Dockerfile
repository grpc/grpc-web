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

WORKDIR /github/grpc-node

RUN git clone https://github.com/grpc/grpc-node . && \
  git submodule --quiet update --init --recursive

RUN cd packages/grpc-native-core && \
  npm install --build-from-source --unsafe-perm && \
  npm link

RUN cd packages/proto-loader && \
  npm install @types/mocha@7.0.2&& \
  npm install --unsafe-perm

WORKDIR /github/grpc-node/test

RUN npm install node-pre-gyp && \
  npm install && \
  npm link grpc

EXPOSE 7074
CMD ["node", "--require", "./fixtures/native_native", "./interop/interop_server.js", "--port=7074"]
