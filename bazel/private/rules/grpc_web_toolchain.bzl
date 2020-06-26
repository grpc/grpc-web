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

"""Contains the definition of `grpc_web_toolchain`."""

def _grpc_web_toolchain_impl(ctx):
    return [
        platform_common.ToolchainInfo(
            generator = ctx.attr.generator.files_to_run,
            runtime_library = ctx.attr.runtime_library,
        ),
    ]

grpc_web_toolchain = rule(
    implementation = _grpc_web_toolchain_impl,
    attrs = {
        "generator": attr.label(
            mandatory = True,
            executable = True,
            cfg = "exec",
        ),
        "runtime_library": attr.label(
            mandatory = False,
            cfg = "target",
            providers = ["closure_js_library"],
        ),
    },
    provides = [
        platform_common.ToolchainInfo,
    ],
)
