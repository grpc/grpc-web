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

ARG MAKEFLAGS=-j8
ARG BUILDIFIER_VERSION=1.0.0
ARG BAZEL_VERSION=2.2.0


WORKDIR /github/grpc-web

RUN git checkout . && \
  git clean -f -d -x && \
  rm -rf third_party && \
  git checkout third_party && \
  ./scripts/init_submodules.sh

COPY ./Makefile ./Makefile
COPY ./javascript ./javascript
COPY ./net ./net
COPY ./packages ./packages
COPY ./scripts ./scripts
COPY ./test ./test

RUN cd ./packages/grpc-web && \
  npm install && \
  npm run build && \
  npm link

RUN wget -O buildifier \
  https://github.com/bazelbuild/buildtools/releases/download/$BUILDIFIER_VERSION/buildifier && \
  chmod +x ./buildifier && \
  ./buildifier --mode=check --lint=warn --warnings=all -r bazel javascript net && \
  rm ./buildifier

RUN wget -O bazel-installer.sh \
  https://github.com/bazelbuild/bazel/releases/download/$BAZEL_VERSION/\
bazel-$BAZEL_VERSION-installer-linux-x86_64.sh && \
  chmod +x ./bazel-installer.sh && \
  ./bazel-installer.sh && \
  rm ./bazel-installer.sh

RUN bazel build javascript/net/grpc/web/... && \
  cp $(bazel info bazel-genfiles)/javascript/net/grpc/web/protoc-gen-grpc-web \
  /usr/local/bin/protoc-gen-grpc-web
