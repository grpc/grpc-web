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

run_tests () {
  docker run --network=host --rm grpcweb/prereqs /bin/bash \
    /github/grpc-web/scripts/docker-run-interop-tests.sh
}

SCRIPT_DIR=$(dirname "$0")
REPO_DIR=$(realpath "${SCRIPT_DIR}/..")

# Set up
cd "${REPO_DIR}"

# These programs need to be already installed
progs=(docker docker-compose npm)
for p in "${progs[@]}"
do
  command -v "$p" > /dev/null 2>&1 || \
    { echo >&2 "$p is required but not installed. Aborting."; exit 1; }
done

function cleanup () {
  echo "Killing lingering Docker servers..."
  docker rm -f "$pid1"
  docker rm -f "$pid2"
}

trap cleanup EXIT

# Build all relevant docker images. They should all build successfully.
docker-compose build prereqs node-interop-server

##########################################################
# Run interop tests (against Envoy)
##########################################################
echo -e "\n[Running] Interop test (Envoy)"
pid1=$(docker run -d \
  -v "$(pwd)"/test/interop/envoy.yaml:/etc/envoy/envoy.yaml:ro \
  --network=host envoyproxy/envoy:v1.22.0)
pid2=$(docker run -d --network=host grpcweb/node-interop-server)

run_tests

docker rm -f "$pid1"
docker rm -f "$pid2"