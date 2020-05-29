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

# Set up
cd "${REPO_DIR}"


# These programs need to be already installed
progs=(docker docker-compose npm curl)
for p in "${progs[@]}"
do
  command -v "$p" > /dev/null 2>&1 || \
    { echo >&2 "$p is required but not installed. Aborting."; exit 1; }
done


# Build all relevant docker images. They should all build successfully.
if [[ "$MASTER" == "1" ]]; then
  # Build all for continuous_integration
  docker-compose build
else
  # Only build a subset of docker images for presubmit runs
  docker-compose build common prereqs envoy node-server \
    commonjs-client ts-client
fi


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


# Clean up
git clean -f -d -x
echo 'Completed'
