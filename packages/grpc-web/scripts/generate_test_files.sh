#!/bin/bash
# Copyright 2021 Google Inc. All Rights Reserved.
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

# Generates the temporary files needed for tests to run, putting them in the
# generated/ directory.
#
# Usage:
# $ cd packages/grpc-web
# $ ./scripts/generate_test_files.sh

set -ex

SCRIPT_DIR=$(dirname "$0")
REPO_DIR=$(realpath "${SCRIPT_DIR}/../")
JAVASCRIPT_DIR=$(realpath "${SCRIPT_DIR}/../../../javascript")
GEN_DIR="$REPO_DIR/generated"

cd "$REPO_DIR"

mkdir -p "$GEN_DIR"

echo "Generating dependency file..."
$(npm bin)/closure-make-deps \
    --closure-path="node_modules/google-closure-library/closure/goog" \
    --file="node_modules/google-closure-library/closure/goog/deps.js" \
    --root="$JAVASCRIPT_DIR" \
    --exclude="$GEN_DIR/all_tests.js" \
    --exclude="$GEN_DIR/deps.js" \
    > "$GEN_DIR/deps.js"

echo "Generating test HTML files..."
python3 ./scripts/gen_test_htmls.py
python3 ./scripts/gen_all_tests_js.py

echo "Done."
