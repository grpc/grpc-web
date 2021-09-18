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

# Run a curl request to test the output of the proxy and the backend server.
# This is a simple unary call with "hello" as the protobuf message
out=$(curl -s 'http://localhost:8080/grpc.gateway.testing.EchoService/Echo' \
  -H 'Content-Type: application/grpc-web-text' \
  -H 'Accept: application/grpc-web-text' \
  -H 'Connection: keep-alive' \
  -H 'X-Grpc-Web: 1' \
  -H 'X-User-Agent: grpc-web-javascript/0.1' \
  --data-binary 'AAAAAAcKBWhlbGxv')

# Cut out a few parts of the response that we are reasonably sure that should
# not change.
#
# Take the first 13 bytes:
#   First byte: 00 (data marker)
#   Next 4 bytes: 00 00 00 07 (length of payload)
#   Next 7 bytes: 0a 05 68 65 6c 6c 6f (binary proto of "1: hello")
#   Next 1 byte: 80 (trailer marker)
# Skip the next 4 bytes:
#   This represents the length of the trailer frame, which could be unreliable.
# Take the next 15 bytes:
#   This is the beginning of the trailer frame, which we are reasonably sure
#   that it will begin with:
#     grpc-status:0\r\n
s1=$(echo "$out" | base64 -d | \
  { dd bs=1 count=13 ; dd skip=4 bs=1 count=15 ; } 2>/dev/null | \
  base64)

echo "$s1" | base64 -d | xxd

# Take the 28 bytes we cut out above, the base64-encoded string should be this
if [[ "$s1" != "AAAAAAcKBWhlbGxvgGdycGMtc3RhdHVzOjANCg==" ]]; then
  exit 1;
else
  echo "Envoy proxy test successful!"
fi
