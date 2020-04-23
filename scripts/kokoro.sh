#!/bin/bash
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
set -ex

SCRIPT_DIR=$(dirname "$0")
REPO_DIR=$(realpath "${SCRIPT_DIR}/..")

cd "${REPO_DIR}"
./scripts/init_submodules.sh
make clean

# These programs need to be already installed
progs=(docker docker-compose npm curl)
for p in "${progs[@]}"
do
  command -v "$p" > /dev/null 2>&1 || \
    { echo >&2 "$p is required but not installed. Aborting."; exit 1; }
done

# Lint bazel files.
BUILDIFIER_VERSION=1.0.0
BUILDIFIER_SUFFIX=""
if [[ "$OSTYPE" == "darwin"* ]]; then
  BUILDIFIER_SUFFIX=".mac"
fi
wget -O buildifier "https://github.com/bazelbuild/buildtools/releases/download/${BUILDIFIER_VERSION}/buildifier${BUILDIFIER_SUFFIX}"
chmod +x "./buildifier"
./buildifier -version
./buildifier --mode=check --lint=warn --warnings=all -r bazel javascript net
rm ./buildifier

# Run all bazel unit tests
BAZEL_VERSION=2.2.0
BAZEL_OS="linux"
if [[ "$OSTYPE" == "darwin"* ]]; then
  BAZEL_OS="darwin"
fi
wget -O bazel-installer.sh https://github.com/bazelbuild/bazel/releases/download/"${BAZEL_VERSION}"/bazel-"${BAZEL_VERSION}"-installer-"${BAZEL_OS}"-x86_64.sh
chmod +x ./bazel-installer.sh
./bazel-installer.sh --user
rm ./bazel-installer.sh
$HOME/bin/bazel version
$HOME/bin/bazel clean
$HOME/bin/bazel test \
  //javascript/net/grpc/web/... \
  //net/grpc/gateway/examples/...

# Build the protoc plugin
make plugin

# Build the grpc-web npm package
cd packages/grpc-web && \
  npm install && \
  npm run build && \
  npm link && \
  cd ../..

# Build all relevant docker images. They should all build successfully.
docker-compose -f advanced.yml build

# Bring up the Echo server and the Envoy proxy (in background).
# The 'sleep' seems necessary for the docker containers to be fully up
# and listening before we test the with curl requests
docker-compose up -d node-server envoy && sleep 5;

# Run a curl request and verify the output
source ./scripts/test-proxy.sh

# Remove all docker containers
docker-compose down

# Run unit tests from npm package
docker run --rm grpcweb/prereqs /bin/bash \
  /github/grpc-web/scripts/docker-run-tests.sh

# Run interop tests
pid1=$(docker run -d -v $(pwd)/test/interop/envoy.yaml:/etc/envoy/envoy.yaml:ro \
  --network=host -p 8080:8080 envoyproxy/envoy:v1.14.1)
pid2=$(docker run -d --network=host -p 7074:7074 grpcweb/node-interop-server)

cd test/interop && \
  npm install && \
  npm link grpc-web && \
  protoc -I=../.. src/proto/grpc/testing/test.proto \
  src/proto/grpc/testing/empty.proto \
  src/proto/grpc/testing/messages.proto \
  --plugin=protoc-gen-grpc-web=$(pwd)/../../javascript/net/grpc/web/protoc-gen-grpc-web \
  --js_out=import_style=commonjs:. \
  --grpc-web_out=import_style=commonjs,mode=grpcwebtext:. && \
  npm test && \
  cd ../..

# Clean up
docker rm -f $pid1
docker rm -f $pid2
git clean -f -d -x
echo 'Completed'
