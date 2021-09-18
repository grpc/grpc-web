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
"""Generates the all_tests.js file for consumption by Protractor.

Usage:
$ cd packages/grpc-web
$ python3 ./scripts/gen_test_htmls.py # Prerequisite
$ python3 ./scripts/gen_all_tests_js.py
"""

from string import Template

import common

ALL_TESTS_TEMPLATE_FILE = './scripts/template_all_tests_js.txt'

# The path of the generated all_tests.js file
GENERATED_ALL_TESTS_JS_PATH = './generated/all_tests.js'

# File paths needs to be prepended by the relative path of the grpc-web package
# because web server is hosting the root of github repo for tests to access the
# javascript files.
GRPC_WEB_BASE_DIR = 'packages/grpc-web'


def main():
    template_data = common.read_file(ALL_TESTS_TEMPLATE_FILE)
    template = Template(template_data)

    test_html_paths = []
    for file_name in common.get_files_with_suffix(
            common.GENERATED_TEST_BASE_PATH, '_test.html'):
        test_html_paths.append("  '%s/%s'," % (GRPC_WEB_BASE_DIR, file_name))
    # Example output paths:
    # 'packages/grpc-web/generated/test_htmls/javascript__net__grpc__web__grpcwebclientbase_test.html',
    # 'packages/grpc-web/generated/test_htmls/javascript__net__grpc__web__grpcwebstreamparser_test.html',
    test_html_paths_str = "\n".join(test_html_paths)

    # Writes the generated output to the all_tests.js file.
    common.write_file(GENERATED_ALL_TESTS_JS_PATH,
                      template.substitute(test_html_paths=test_html_paths_str))


if __name__ == "__main__":
    main()
