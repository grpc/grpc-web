## Copyright 2020 Google LLC
##
## Licensed under the Apache License, Version 2.0 (the "License");
## you may not use this file except in compliance with the License.
## You may obtain a copy of the License at
##
##     https://www.apache.org/licenses/LICENSE-2.0
##
## Unless required by applicable law or agreed to in writing, software
## distributed under the License is distributed on an "AS IS" BASIS,
## WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
## See the License for the specific language governing permissions and
## limitations under the License.

"""Starlark rules for using gRPC-Web."""

load("//bazel/private/rules:closure_grpc_web_library.bzl", _closure_grpc_web_library = "closure_grpc_web_library")
load("//bazel/private/rules:grpc_web_toolchain.bzl", _grpc_web_toolchain = "grpc_web_toolchain")

closure_grpc_web_library = _closure_grpc_web_library
grpc_web_toolchain = _grpc_web_toolchain
