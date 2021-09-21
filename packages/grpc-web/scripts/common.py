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
"""Common methods and constants for generating test files."""

import os
from typing import Iterator

# The directory in which test HTML files are generated.
GENERATED_TEST_BASE_PATH = "generated/test_htmls/"


def read_file(path: str) -> str:
    """Reads the content of a file."""
    with open(path) as f:
        return f.read()


def write_file(path: str, content: str):
    """Writes a string to file, overwriting existing content; intermediate
    directories are created if not present."""
    dir_name = os.path.dirname(path)
    if not os.path.exists(dir_name):
        os.makedirs(dir_name)

    with open(path, "w") as f:
        f.write(content)


def get_files_with_suffix(root_dir: str, suffix: str) -> Iterator[str]:
    """Yields file names under a directory with a given suffix."""
    for dir_path, _, file_names in os.walk(root_dir):
        for file_name in file_names:
            if file_name.endswith(suffix):
                yield os.path.join(dir_path, file_name)
