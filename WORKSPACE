workspace(name = "com_github_grpc_grpc_web")

load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

http_archive(
    name = "io_bazel_rules_closure",
    sha256 = "319e5e0127a83436b55588877a9d81464c2780c0dffc809065cf299d772670f5",
    strip_prefix = "rules_closure-87d24b1df8b62405de8dd059cb604fd9d4b1e395",
    urls = [
        "https://github.com/bazelbuild/rules_closure/archive/87d24b1df8b62405de8dd059cb604fd9d4b1e395.zip",
    ],
)

load("@io_bazel_rules_closure//closure:defs.bzl", "closure_repositories")

closure_repositories()
