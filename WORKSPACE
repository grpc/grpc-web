workspace(name = "com_github_grpc_grpc_web")

load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

http_archive(
    name = "io_bazel_rules_closure",
    sha256 = "3098d87bb0b5be7399b402da45b360b07a401bbd6d2b0033b0c16c4d060f4d01",
    strip_prefix = "rules_closure-d1110778a2e94bcdac5d5d00044dcb6cd07f1d51",
    urls = [
        "https://github.com/bazelbuild/rules_closure/archive/d1110778a2e94bcdac5d5d00044dcb6cd07f1d51.zip",
    ],
)

load("@io_bazel_rules_closure//closure:defs.bzl", "closure_repositories")

closure_repositories()
