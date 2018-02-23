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

cd "$(dirname "$0")"
./init_submodules.sh
cd ..
make clean
docker build -t debian_stretch -f net/grpc/gateway/docker/debian_stretch/Dockerfile .
CONTAINER_ID=$(docker create debian_stretch)
docker cp "$CONTAINER_ID:/github/grpc-web/gConnector.zip" net/grpc/gateway/docker/debian_stretch
docker cp "$CONTAINER_ID:/github/grpc-web/gConnector_static.zip" net/grpc/gateway/docker/debian_stretch
docker rm "$CONTAINER_ID"
