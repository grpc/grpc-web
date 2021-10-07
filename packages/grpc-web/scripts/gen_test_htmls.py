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
"""Generates *_test.html files from *_test.js files.

Usage:
$ cd packages/grpc-web
$ python3 ./scripts/gen_test_htmls.py
"""

import os
import re
from string import Template

import common

# The directories containing JS tests.
DIRECTORIES_WITH_TESTS = ["../../javascript"]

TEST_HTML_TEMPLATE_FILE = './scripts/template_test_html.txt'


def main():
    template_data = common.read_file(TEST_HTML_TEMPLATE_FILE)
    template = Template(template_data)
    for directory in DIRECTORIES_WITH_TESTS:
        for js_file_path in common.get_files_with_suffix(
                directory, "_test.js"):
            _gen_test_html(js_file_path, template)


def _gen_test_html(js_file_path: str, template: Template):
    """Generates a Closure test wrapper HTML and saves it to the filesystem."""
    # Generates the test_file_name so that:
    #   ../../javascript/net/grpc/web/grpcwebclientbase_test.js
    # will now be named:
    #   javascript__net__grpc__web__grpcwebclientbase_test.html
    test_file_name = js_file_path
    while test_file_name.startswith('../'):
        test_file_name = test_file_name[3:]
    test_file_name = test_file_name.replace('/', '__')
    test_file_name = os.path.splitext(test_file_name)[0] + '.html'

    # Generates the test HTML using the package name of the test file
    package_name = _extract_closure_package(js_file_path)
    generated_html = template.substitute(package=package_name)

    # Writes the test HTML files
    common.write_file(common.GENERATED_TEST_BASE_PATH + test_file_name,
                      generated_html)


def _extract_closure_package(js_file_path) -> str:
    """Extracts the package name from goog.provide() or goog.module() in the
    JS file."""
    js_data = common.read_file(js_file_path)
    matches = re.search(r"goog\.(provide|module)\([\n\s]*'(.+)'\);", js_data)

    if matches is None:
        raise ValueError("goog.provide() or goog.module() not found in file")

    return matches.group(2)


if __name__ == "__main__":
    main()
