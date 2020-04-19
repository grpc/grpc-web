workspace(name = "com_github_grpc_grpc_web")

load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

http_archive(
    name = "io_bazel_rules_closure",
    sha256 = "d7a04263cf5b7af90f52d759da1e50c3cfe81c6cb16eec430af86e6bed248098",
    strip_prefix = "rules_closure-0e187366b658d1796d2580f8b7e1a8d7e7e1492d",
    urls = [
        "https://github.com/bazelbuild/rules_closure/archive/0e187366b658d1796d2580f8b7e1a8d7e7e1492d.zip",
    ],
)

load("@io_bazel_rules_closure//closure:repositories.bzl", "rules_closure_dependencies", "rules_closure_toolchains")

rules_closure_dependencies()

rules_closure_toolchains()
