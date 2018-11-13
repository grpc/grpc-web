workspace(name = "com_github_grpc_grpc_web")

http_archive(
    name = "io_bazel_rules_closure",
    sha256 = "a8ea3251a6fd05eb3dbd05aa443a12b04cb88d80480d821bee453b18db97afaa",
    strip_prefix = "rules_closure-8ec740d0b77ca1fb4914c857dc67ccc3f9cb3ed4",
    urls = [
        "https://github.com/bazelbuild/rules_closure/archive/8ec740d0b77ca1fb4914c857dc67ccc3f9cb3ed4.zip",
    ],
)

load("@io_bazel_rules_closure//closure:defs.bzl", "closure_repositories")

closure_repositories()
