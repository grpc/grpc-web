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

# Lint bazel files.
BUILDIFIER_VERSION=0.22.0
wget "https://github.com/bazelbuild/buildtools/releases/download/${BUILDIFIER_VERSION}/buildifier"
chmod +x "./buildifier"
./buildifier -version
BAZEL_FILES=$(find "${REPO_DIR}" \
    -not -path "${REPO_DIR}/.git/*" -and \
    -not -path "${REPO_DIR}/third_party/*" -and \
    \( -name "BUILD.bazel" -o -name "*.bzl" \))
./buildifier -mode check ${BAZEL_FILES[@]}
rm ./buildifier

# These programs need to be already installed
progs=(docker docker-compose npm curl)
for p in "${progs[@]}"
do
  command -v "$p" > /dev/null 2>&1 || \
    { echo >&2 "$p is required but not installed. Aborting."; exit 1; }
done

# Build all relevant docker images. They should all build successfully.
docker-compose -f advanced.yml build

# Run all bazel unit tests
BAZEL_VERSION=0.23.1
wget https://github.com/bazelbuild/bazel/releases/download/"${BAZEL_VERSION}"/bazel-"${BAZEL_VERSION}"-installer-linux-x86_64.sh
chmod +x ./bazel-"${BAZEL_VERSION}"-installer-linux-x86_64.sh
./bazel-"${BAZEL_VERSION}"-installer-linux-x86_64.sh --user
rm ./bazel-"${BAZEL_VERSION}"-installer-linux-x86_64.sh
$HOME/bin/bazel version
$HOME/bin/bazel test \
  //javascript/net/grpc/web/... \
  //net/grpc/gateway/examples/...

# Build the grpc-web npm package
cd packages/grpc-web && \
  npm install && \
  npm run build && \
  cd ../..

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
