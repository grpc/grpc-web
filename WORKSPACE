workspace(name = "com_github_grpc_grpc_web")

load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

http_archive(
    name = "io_bazel_rules_closure",
    sha256 = "fecda06179906857ac79af6500124bf03fe1630fd1b3d4dcf6c65346b9c0725d",
    strip_prefix = "rules_closure-03110588392d8c6c05b99c08a6f1c2121604ca27",
    urls = [
        "https://github.com/bazelbuild/rules_closure/archive/03110588392d8c6c05b99c08a6f1c2121604ca27.zip",
    ],
)

load("@io_bazel_rules_closure//closure:defs.bzl", "closure_repositories")

closure_repositories()
