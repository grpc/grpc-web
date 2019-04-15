workspace(name = "com_github_grpc_grpc_web")

load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

http_archive(
    name = "io_bazel_rules_closure",
    sha256 = "1f8d2e169bb292ef2adbe563bd66d5b8d4b462b6b869a67647e771ecef4b5030",
    strip_prefix = "rules_closure-a176ec89a1b251bb5442ba569d47cee3c053e633",
    urls = [
        "https://github.com/bazelbuild/rules_closure/archive/a176ec89a1b251bb5442ba569d47cee3c053e633.zip",
    ],
)

load("@io_bazel_rules_closure//closure:defs.bzl", "closure_repositories")

closure_repositories()
